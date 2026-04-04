import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validatePeriodicGift } from "@/lib/anbi";
import { parseSignatureBase64, getClientIp } from "@/lib/signatures";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { emailLayout } from "@/lib/email/templates/layout";
import { formatMoney } from "@/lib/money";
import { escapeHtml } from "@/lib/escape-html";

/**
 * Public endpoint for donors to submit a signed periodic gift agreement.
 * No auth required — creates/finds donor, stores signature, returns JSON.
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { success } = await rateLimit(`periodic-gift:${ip}`, 5, 60_000);
    if (!success) {
      return NextResponse.json(
        { error: "Te veel verzoeken, probeer later opnieuw" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const {
      mosque_slug,
      donor_name,
      donor_email,
      donor_address,
      donor_bsn,
      annual_amount,
      fund_id,
      start_date,
      end_date,
      signature_base64,
    } = body as {
      mosque_slug: string;
      donor_name: string;
      donor_email: string;
      donor_address: string;
      donor_bsn: string;
      annual_amount: number;
      fund_id?: string;
      start_date: string;
      end_date: string;
      signature_base64: string;
    };

    if (
      !mosque_slug ||
      !donor_name ||
      !donor_email ||
      !donor_address ||
      !donor_bsn ||
      !annual_amount ||
      !start_date ||
      !end_date ||
      !signature_base64
    ) {
      return NextResponse.json(
        { error: "Vul alle verplichte velden in" },
        { status: 400 },
      );
    }

    // Validate BSN format (9 digits, art. 41 lid 1 sub a URIB 2001)
    if (!/^\d{9}$/.test(donor_bsn)) {
      return NextResponse.json(
        { error: "BSN moet uit 9 cijfers bestaan" },
        { status: 400 },
      );
    }

    // Validate signature
    let rawBase64: string;
    try {
      rawBase64 = parseSignatureBase64(signature_base64);
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 400 },
      );
    }

    const amountCents = Math.round(annual_amount * 100);

    const validationError = validatePeriodicGift({
      startDate: start_date,
      endDate: end_date,
      annualAmount: amountCents,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch mosque (must be ANBI and approved)
    const { data: mosque } = await admin
      .from("mosques")
      .select("id, name, address, rsin, kvk, anbi_status, status")
      .eq("slug", mosque_slug)
      .single();

    if (!mosque || mosque.status !== "active") {
      return NextResponse.json(
        { error: "Moskee niet gevonden" },
        { status: 404 },
      );
    }
    if (!mosque.anbi_status || !mosque.rsin) {
      return NextResponse.json(
        { error: "Deze moskee heeft geen ANBI-status" },
        { status: 400 },
      );
    }

    // Find or create donor
    let donorId: string;
    const { data: existingDonor } = await admin
      .from("donors")
      .select("id")
      .eq("mosque_id", mosque.id)
      .eq("email", donor_email)
      .single();

    if (existingDonor) {
      donorId = existingDonor.id;
      await admin
        .from("donors")
        .update({ name: donor_name, address: donor_address })
        .eq("id", donorId);
    } else {
      const { data: newDonor, error: donorError } = await admin
        .from("donors")
        .insert({
          mosque_id: mosque.id,
          name: donor_name,
          email: donor_email,
          address: donor_address,
        })
        .select("id")
        .single();

      if (donorError || !newDonor) {
        console.error("Create donor error:", donorError);
        return NextResponse.json(
          { error: "Fout bij aanmaken donateur" },
          { status: 500 },
        );
      }
      donorId = newDonor.id;
    }

    // Create agreement (defaults to pending_board)
    const { data: agreement, error: agreementError } = await admin
      .from("periodic_gift_agreements")
      .insert({
        mosque_id: mosque.id,
        donor_id: donorId,
        annual_amount: amountCents,
        fund_id: fund_id || null,
        start_date,
        end_date,
        donor_bsn,
      })
      .select("id, transaction_number")
      .single();

    if (agreementError || !agreement) {
      console.error("Create agreement error:", agreementError);
      return NextResponse.json(
        { error: "Fout bij aanmaken overeenkomst" },
        { status: 500 },
      );
    }

    // Upload donor signature to storage
    const signaturePath = `${agreement.id}/donor.png`;
    const { error: uploadError } = await admin.storage
      .from("signatures")
      .upload(signaturePath, Buffer.from(rawBase64, "base64"), {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Signature upload error:", uploadError);
      return NextResponse.json(
        { error: "Fout bij opslaan handtekening" },
        { status: 500 },
      );
    }

    // Record signature metadata
    const now = new Date().toISOString();
    const clientIp = getClientIp(request);

    await admin
      .from("periodic_gift_agreements")
      .update({
        donor_signature_url: signaturePath,
        donor_signed_at: now,
        donor_ip: clientIp,
      })
      .eq("id", agreement.id);

    // Notify mosque admin(s) about the new periodic gift
    try {
      const { data: admins } = await admin
        .from("users")
        .select("email")
        .eq("mosque_id", mosque.id)
        .eq("role", "admin");

      const amountCentsForEmail = amountCents;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adminEmails = (admins ?? [])
        .map((a: any) => a.email)
        .filter(Boolean);

      if (adminEmails.length > 0) {
        const html = emailLayout({
          title: `Nieuwe periodieke gift — ${escapeHtml(mosque.name)}`,
          body: `
            <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #18181b;">Nieuwe periodieke gift</h1>
            <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
              Er is een nieuwe periodieke gift overeenkomst ingediend die wacht op uw goedkeuring.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; border-radius: 6px; margin-bottom: 24px;">
              <tr><td style="padding: 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 4px 0; font-size: 14px; color: #71717a; width: 120px;">Donateur</td>
                    <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500;">${escapeHtml(donor_name)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 14px; color: #71717a;">Jaarbedrag</td>
                    <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500;">${formatMoney(amountCentsForEmail)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 14px; color: #71717a;">Looptijd</td>
                    <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500;">${new Date(start_date).toLocaleDateString("nl-NL")} t/m ${new Date(end_date).toLocaleDateString("nl-NL")}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <p style="margin: 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
              Ga naar het ANBI-tabblad in uw dashboard om de overeenkomst te ondertekenen.
            </p>`,
        });

        for (const email of adminEmails) {
          await sendEmail({
            to: email,
            subject: `Nieuwe periodieke gift van ${escapeHtml(donor_name)} — ${escapeHtml(mosque.name)}`,
            html,
          });
        }
      }
    } catch (emailErr) {
      console.error("Periodic gift admin notification error:", emailErr);
    }

    return NextResponse.json(
      { success: true, agreement_id: agreement.id },
      { status: 201 },
    );
  } catch (err) {
    console.error("Public periodic gift error:", err);
    return NextResponse.json(
      { error: "Er is iets misgegaan" },
      { status: 500 },
    );
  }
}
