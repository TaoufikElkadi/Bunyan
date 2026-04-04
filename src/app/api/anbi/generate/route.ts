import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { renderToBuffer } from "@react-pdf/renderer";
import { AnbiReceipt } from "@/lib/pdf/anbi-receipt";
import type { AnbiReceiptData } from "@/lib/pdf/anbi-receipt";
import {
  groupDonationsByDonor,
  formatReceiptNumber,
  parseReceiptSequence,
  type RawDonation,
} from "@/lib/anbi";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { success } = await rateLimit(`anbi-generate:${ip}`, 10, 60_000);
    if (!success) {
      return NextResponse.json(
        { error: "Te veel verzoeken. Probeer het later opnieuw." },
        { status: 429 },
      );
    }

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
      .select("mosque_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Geen toestemming" }, { status: 403 });
    }

    const body = await request.json();
    const { year, donor_id } = body as { year: number; donor_id?: string };

    if (!year || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Ongeldig jaar" }, { status: 400 });
    }

    // Get mosque info for the receipt
    const { data: mosque } = await supabase
      .from("mosques")
      .select("name, address, rsin, kvk, anbi_status")
      .eq("id", profile.mosque_id)
      .single();

    if (!mosque) {
      return NextResponse.json(
        { error: "Moskee niet gevonden" },
        { status: 404 },
      );
    }

    if (!mosque.rsin) {
      return NextResponse.json(
        {
          error:
            "RSIN is niet ingesteld. Configureer dit eerst bij Instellingen.",
        },
        { status: 400 },
      );
    }

    const startDate = `${year}-01-01T00:00:00.000Z`;
    const endDate = `${year + 1}-01-01T00:00:00.000Z`;

    // Build query for completed, non-cash donations
    let query = supabase
      .from("donations")
      .select(
        "id, donor_id, fund_id, amount, method, funds(name), donors(id, name, email, address)",
      )
      .eq("mosque_id", profile.mosque_id)
      .eq("status", "completed")
      .neq("method", "cash")
      .gte("created_at", startDate)
      .lt("created_at", endDate)
      .not("donor_id", "is", null);

    if (donor_id) {
      query = query.eq("donor_id", donor_id);
    }

    const { data: donations, error } = await query;

    if (error) {
      console.error("ANBI generate query error:", error);
      return NextResponse.json(
        { error: "Fout bij ophalen donaties" },
        { status: 500 },
      );
    }

    const donorMap = groupDonationsByDonor(
      (donations ?? []) as unknown as RawDonation[],
    );

    if (donorMap.size === 0) {
      return NextResponse.json(
        { error: "Geen in aanmerking komende donaties gevonden" },
        { status: 404 },
      );
    }

    const issueDate = new Date().toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const admin = createAdminClient();

    // Get current max receipt sequence for this mosque+year
    const { data: existingReceipts } = await admin
      .from("anbi_receipts")
      .select("receipt_number")
      .eq("mosque_id", profile.mosque_id)
      .like("receipt_number", `ANBI-${year}-%`);

    let maxSeq = 0;
    for (const r of existingReceipts ?? []) {
      if (r.receipt_number) {
        const seq = parseReceiptSequence(r.receipt_number);
        if (seq > maxSeq) maxSeq = seq;
      }
    }

    // Fetch active periodic gift agreements for this mosque+year to classify gifts
    const { data: periodicAgreements } = await admin
      .from("periodic_gift_agreements")
      .select("donor_id, annual_amount, start_date, end_date")
      .eq("mosque_id", profile.mosque_id)
      .eq("status", "active")
      .lte("start_date", `${year}-12-31`)
      .gte("end_date", `${year}-01-01`);

    const periodicByDonor = new Map(
      (periodicAgreements ?? []).map((a) => [
        a.donor_id,
        {
          annualAmount: a.annual_amount,
          startDate: new Date(a.start_date).toLocaleDateString("nl-NL"),
          endDate: new Date(a.end_date).toLocaleDateString("nl-NL"),
        },
      ]),
    );

    // Single donor: return PDF directly
    if (donor_id && donorMap.size === 1) {
      const [donorId, donorData] = Array.from(donorMap.entries())[0];

      // Check if receipt already exists for this donor+year
      const { data: existing } = await admin
        .from("anbi_receipts")
        .select("receipt_number")
        .eq("mosque_id", profile.mosque_id)
        .eq("donor_id", donorId)
        .eq("year", year)
        .single();

      const receiptNumber =
        existing?.receipt_number ?? formatReceiptNumber(year, maxSeq + 1);

      const receiptData: AnbiReceiptData = {
        mosqueName: mosque.name,
        mosqueAddress: mosque.address ?? "",
        rsin: mosque.rsin,
        kvk: mosque.kvk ?? null,
        receiptNumber,
        donorName: donorData.name,
        donorAddress: donorData.address,
        year,
        fundBreakdown: Array.from(donorData.funds.values()),
        totalAmount: donorData.totalAmount,
        issueDate,
        periodicGift: periodicByDonor.get(donorId),
      };

      const pdfBuffer = await renderToBuffer(
        AnbiReceipt({ data: receiptData }),
      );

      // Upload PDF to Supabase Storage
      const sanitizedReceiptNumber = receiptNumber.replace(
        /[^a-zA-Z0-9_-]/g,
        "_",
      );
      const pdfPath = `${profile.mosque_id}/${year}/${sanitizedReceiptNumber}.pdf`;

      const { error: uploadError } = await admin.storage
        .from("anbi-receipts")
        .upload(pdfPath, pdfBuffer, {
          upsert: true,
          contentType: "application/pdf",
        });

      if (uploadError) {
        console.error("ANBI storage upload error:", uploadError);
      }

      // Upsert the receipt record
      const fundBreakdown: Record<string, number> = {};
      for (const [, fund] of donorData.funds) {
        fundBreakdown[fund.fundName] = fund.amount;
      }

      await admin.from("anbi_receipts").upsert(
        {
          mosque_id: profile.mosque_id,
          donor_id: donorId,
          year,
          total_amount: donorData.totalAmount,
          fund_breakdown: fundBreakdown,
          receipt_number: receiptNumber,
          pdf_path: uploadError ? null : pdfPath,
        },
        { onConflict: "mosque_id,donor_id,year" },
      );

      const fileName = `ANBI_${year}_${donorData.name.replace(/\s+/g, "_")}.pdf`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    }

    // Bulk generation: batch-fetch existing receipts, generate with bounded concurrency, batch upsert
    const donorIds = Array.from(donorMap.keys());

    const { data: bulkExisting } = await admin
      .from("anbi_receipts")
      .select("donor_id, receipt_number")
      .eq("mosque_id", profile.mosque_id)
      .eq("year", year)
      .in("donor_id", donorIds);

    const existingByDonor = new Map<string, string>();
    for (const r of bulkExisting ?? []) {
      if (r.receipt_number) {
        existingByDonor.set(r.donor_id, r.receipt_number);
      }
    }

    let seqCounter = maxSeq;
    const CONCURRENCY = 3;

    type ReceiptRecord = {
      mosque_id: string;
      donor_id: string;
      year: number;
      total_amount: number;
      fund_breakdown: Record<string, number>;
      receipt_number: string;
      pdf_path: string | null;
    };

    const receiptRecords: ReceiptRecord[] = [];

    const tasks = Array.from(donorMap.entries()).map(([donorId, donorData]) => {
      const receiptNumber =
        existingByDonor.get(donorId) ?? formatReceiptNumber(year, ++seqCounter);

      const receiptData: AnbiReceiptData = {
        mosqueName: mosque.name,
        mosqueAddress: mosque.address ?? "",
        rsin: mosque.rsin,
        kvk: mosque.kvk ?? null,
        receiptNumber,
        donorName: donorData.name,
        donorAddress: donorData.address,
        year,
        fundBreakdown: Array.from(donorData.funds.values()),
        totalAmount: donorData.totalAmount,
        issueDate,
        periodicGift: periodicByDonor.get(donorId),
      };

      const fundBreakdown: Record<string, number> = {};
      for (const [, fund] of donorData.funds) {
        fundBreakdown[fund.fundName] = fund.amount;
      }

      return { donorId, donorData, receiptData, receiptNumber, fundBreakdown };
    });

    const processDonor = async (task: (typeof tasks)[0]) => {
      const { donorId, donorData, receiptData, receiptNumber, fundBreakdown } =
        task;

      const pdfBuffer = await renderToBuffer(
        AnbiReceipt({ data: receiptData }),
      );

      const sanitizedReceiptNumber = receiptNumber.replace(
        /[^a-zA-Z0-9_-]/g,
        "_",
      );
      const pdfPath = `${profile.mosque_id}/${year}/${sanitizedReceiptNumber}.pdf`;

      const { error: uploadError } = await admin.storage
        .from("anbi-receipts")
        .upload(pdfPath, pdfBuffer, {
          upsert: true,
          contentType: "application/pdf",
        });

      if (uploadError) {
        console.error("ANBI bulk storage upload error:", uploadError);
      }

      receiptRecords.push({
        mosque_id: profile.mosque_id,
        donor_id: donorId,
        year,
        total_amount: donorData.totalAmount,
        fund_breakdown: fundBreakdown,
        receipt_number: receiptNumber,
        pdf_path: uploadError ? null : pdfPath,
      });
    };

    const executing = new Set<Promise<void>>();
    for (const task of tasks) {
      const p = processDonor(task).then(() => {
        executing.delete(p);
      });
      executing.add(p);
      if (executing.size >= CONCURRENCY) {
        await Promise.race(executing);
      }
    }
    await Promise.all(executing);

    if (receiptRecords.length > 0) {
      await admin
        .from("anbi_receipts")
        .upsert(receiptRecords, { onConflict: "mosque_id,donor_id,year" });
    }

    const generatedCount = receiptRecords.length;

    return NextResponse.json({
      success: true,
      generated: generatedCount,
      year,
    });
  } catch (err) {
    console.error("ANBI generate error:", err);
    return NextResponse.json(
      { error: "Er is iets misgegaan" },
      { status: 500 },
    );
  }
}
