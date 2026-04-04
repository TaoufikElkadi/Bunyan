import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { parseSignatureBase64 } from "@/lib/signatures";
import { sendMosqueEmail } from "@/lib/email/send";
import { emailLayout } from "@/lib/email/templates/layout";
import { formatMoney } from "@/lib/money";
import { renderToBuffer } from "@react-pdf/renderer";
import { PeriodicGiftAgreement } from "@/lib/pdf/periodic-gift-agreement";
import type { PeriodicGiftData } from "@/lib/pdf/periodic-gift-agreement";

async function downloadSignatureAsDataUrl(
  admin: ReturnType<typeof createAdminClient>,
  path: string | null,
): Promise<string | undefined> {
  if (!path) return undefined;
  const { data, error } = await admin.storage.from("signatures").download(path);
  if (error || !data) return undefined;
  const buffer = Buffer.from(await data.arrayBuffer());
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

/**
 * Board member countersigns a periodic gift agreement.
 * Requires admin role. Flips status from pending_board → active.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ip = getClientIp(request);
    const { success } = await rateLimit(`anbi-countersign:${ip}`, 10, 60_000);
    if (!success) {
      return NextResponse.json(
        { error: "Te veel verzoeken. Probeer het later opnieuw." },
        { status: 429 },
      );
    }

    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Niet geautoriseerd" },
        { status: 401 },
      );
    }

    const { data: profile } = await supabase
      .from("users")
      .select("mosque_id, role, name")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Geen toestemming" }, { status: 403 });
    }

    // Verify agreement exists, belongs to this mosque, and is pending
    const { data: agreement } = await supabase
      .from("periodic_gift_agreements")
      .select("id, status")
      .eq("id", id)
      .eq("mosque_id", profile.mosque_id)
      .single();

    if (!agreement) {
      return NextResponse.json(
        { error: "Overeenkomst niet gevonden" },
        { status: 404 },
      );
    }

    if (agreement.status !== "pending_board") {
      return NextResponse.json(
        { error: "Overeenkomst is al ondertekend of geannuleerd" },
        { status: 400 },
      );
    }

    // Validate signature
    const body = await request.json();
    let rawBase64: string;
    try {
      rawBase64 = parseSignatureBase64(body.signature_base64);
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 400 },
      );
    }

    // Upload board signature (use admin client for storage)
    const admin = createAdminClient();
    const signaturePath = `${id}/board.png`;
    const { error: uploadError } = await admin.storage
      .from("signatures")
      .upload(signaturePath, Buffer.from(rawBase64, "base64"), {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Board signature upload error:", uploadError);
      return NextResponse.json(
        { error: "Fout bij opslaan handtekening" },
        { status: 500 },
      );
    }

    // Activate the agreement
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("periodic_gift_agreements")
      .update({
        board_signature_url: signaturePath,
        board_signed_at: now,
        board_signer_id: user.id,
        board_signer_name: profile.name,
        status: "active",
        updated_at: now,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Countersign update error:", updateError);
      return NextResponse.json(
        { error: "Fout bij ondertekenen" },
        { status: 500 },
      );
    }

    // Send confirmation email to donor with signed PDF attached
    try {
      const { data: fullAgreement } = await supabase
        .from("periodic_gift_agreements")
        .select(
          "*, donors(name, email, address), funds(name), mosques(name, address, rsin, kvk, contact_email)",
        )
        .eq("id", id)
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const donor = fullAgreement?.donors as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mosque = fullAgreement?.mosques as any;

      if (donor?.email && mosque?.name) {
        // Generate the signed PDF
        const formatDate = (dateStr: string) =>
          new Date(dateStr).toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });

        const [donorSigDataUrl, boardSigDataUrl] = await Promise.all([
          downloadSignatureAsDataUrl(admin, fullAgreement!.donor_signature_url),
          downloadSignatureAsDataUrl(admin, fullAgreement!.board_signature_url),
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fund = fullAgreement?.funds as any;
        const pdfData: PeriodicGiftData = {
          mosqueName: mosque.name,
          mosqueAddress: mosque.address ?? "",
          rsin: mosque.rsin,
          kvk: mosque.kvk ?? null,
          donorName: donor.name ?? "Onbekend",
          donorAddress: donor.address ?? null,
          donorBsn: fullAgreement!.donor_bsn ?? null,
          annualAmount: fullAgreement!.annual_amount,
          fundName: fund?.name ?? null,
          startDate: formatDate(fullAgreement!.start_date),
          endDate: formatDate(fullAgreement!.end_date),
          issueDate: new Date().toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          transactionNumber: fullAgreement!.transaction_number,
          donorSignatureDataUrl: donorSigDataUrl,
          donorSignedAt: fullAgreement!.donor_signed_at
            ? formatDate(fullAgreement!.donor_signed_at)
            : undefined,
          boardSignatureDataUrl: boardSigDataUrl,
          boardSignedAt: fullAgreement!.board_signed_at
            ? formatDate(fullAgreement!.board_signed_at)
            : undefined,
          boardSignerName: fullAgreement!.board_signer_name ?? undefined,
        };

        const pdfBuffer = await renderToBuffer(
          PeriodicGiftAgreement({ data: pdfData }),
        );
        const donorName = (donor.name ?? "onbekend").replace(/\s+/g, "_");

        const html = emailLayout({
          title: `Periodieke gift bevestigd — ${mosque.name}`,
          body: `
            <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #18181b;">${mosque.name}</h1>
            <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
              Beste ${donor.name || "donateur"},
            </p>
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
              Uw periodieke gift overeenkomst is door het bestuur ondertekend en nu actief. De ondertekende overeenkomst vindt u als bijlage bij deze e-mail.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; border-radius: 6px; margin-bottom: 24px;">
              <tr><td style="padding: 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 4px 0; font-size: 14px; color: #71717a; width: 140px;">Jaarbedrag</td>
                    <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500;">${formatMoney(fullAgreement!.annual_amount)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 14px; color: #71717a;">Looptijd</td>
                    <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500;">${new Date(fullAgreement!.start_date).toLocaleDateString("nl-NL")} t/m ${new Date(fullAgreement!.end_date).toLocaleDateString("nl-NL")}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <p style="margin: 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
              Bewaar dit document voor uw belastingaangifte. U kunt hiermee extra belastingvoordeel behalen.
            </p>`,
        });

        await sendMosqueEmail({
          to: donor.email,
          subject: `Periodieke gift bevestigd — ${mosque.name}`,
          html,
          mosqueName: mosque.name,
          mosqueContactEmail: mosque.contact_email,
          attachments: [
            {
              filename: `Periodieke_gift_${donorName}.pdf`,
              content: new Uint8Array(pdfBuffer),
              contentType: "application/pdf",
            },
          ],
        });
      }
    } catch (emailErr) {
      console.error("Countersign confirmation email error:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Countersign error:", err);
    return NextResponse.json(
      { error: "Er is iets misgegaan" },
      { status: 500 },
    );
  }
}
