import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderToBuffer } from "@react-pdf/renderer";
import { AnbiReceipt } from "@/lib/pdf/anbi-receipt";
import type { AnbiReceiptData } from "@/lib/pdf/anbi-receipt";
import {
  groupDonationsByDonor,
  formatReceiptNumber,
  parseReceiptSequence,
  type RawDonation,
} from "@/lib/anbi";
import JSZip from "jszip";

export async function GET(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get("year");

    if (!yearStr) {
      return NextResponse.json({ error: "Jaar is verplicht" }, { status: 400 });
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
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

    // Fetch all completed, non-cash donations for this mosque + year
    const { data: donations, error } = await supabase
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

    if (error) {
      console.error("ANBI download-zip query error:", error);
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

    // Get existing receipt numbers for this mosque+year
    const { data: existingReceipts } = await admin
      .from("anbi_receipts")
      .select("donor_id, receipt_number")
      .eq("mosque_id", profile.mosque_id)
      .like("receipt_number", `ANBI-${year}-%`);

    const existingByDonor = new Map<string, string>();
    let maxSeq = 0;
    for (const r of existingReceipts ?? []) {
      if (r.receipt_number) {
        existingByDonor.set(r.donor_id, r.receipt_number);
        const seq = parseReceiptSequence(r.receipt_number);
        if (seq > maxSeq) maxSeq = seq;
      }
    }

    // Generate PDFs and bundle into ZIP
    const zip = new JSZip();
    let seqCounter = maxSeq;
    const CONCURRENCY = 3;

    const tasks = Array.from(donorMap.entries()).map(([donorId, donorData]) => {
      const receiptNumber =
        existingByDonor.get(donorId) ?? formatReceiptNumber(year, ++seqCounter);
      return { donorId, donorData, receiptNumber };
    });

    const processDonor = async (task: (typeof tasks)[0]) => {
      const { donorData, receiptNumber } = task;

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
      };

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
        console.error("ANBI zip storage upload error:", uploadError);
      }

      const fileName = `ANBI_${year}_${donorData.name.replace(/\s+/g, "_")}.pdf`;
      zip.file(fileName, pdfBuffer);
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

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="ANBI_${year}_giftenverklaringen.zip"`,
      },
    });
  } catch (err) {
    console.error("ANBI download-zip error:", err);
    return NextResponse.json(
      { error: "Er is iets misgegaan" },
      { status: 500 },
    );
  }
}
