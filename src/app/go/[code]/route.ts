import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { code } = await params;
  const admin = createAdminClient();

  // Look up QR link
  const { data: qrLink } = await admin
    .from("qr_links")
    .select("*, mosques(slug), campaigns(slug)")
    .eq("code", code)
    .single();

  if (!qrLink) {
    return NextResponse.redirect(
      new URL("/", process.env.NEXT_PUBLIC_APP_URL!),
    );
  }

  // Increment scan count atomically (avoids race condition under burst traffic)
  await admin.rpc("increment_scan_count", { link_id: qrLink.id });

  const mosqueSlug = qrLink.mosques?.slug;
  if (!mosqueSlug) {
    return NextResponse.redirect(
      new URL("/", process.env.NEXT_PUBLIC_APP_URL!),
    );
  }

  // Build redirect URL
  let redirectPath: string;

  if (qrLink.campaign_id && qrLink.campaigns?.slug) {
    redirectPath = `/doneren/${mosqueSlug}/${qrLink.campaigns.slug}`;
  } else if (qrLink.fund_id) {
    redirectPath = `/doneren/${mosqueSlug}?fund=${qrLink.fund_id}`;
  } else {
    redirectPath = `/doneren/${mosqueSlug}`;
  }

  return NextResponse.redirect(
    new URL(redirectPath, process.env.NEXT_PUBLIC_APP_URL!),
    302,
  );
}
