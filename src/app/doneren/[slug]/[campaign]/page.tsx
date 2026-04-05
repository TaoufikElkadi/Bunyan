import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { redirectIfOldSlug } from "@/lib/slug-redirect";
import { DonationForm } from "../donation-form";
import { DonationPageShell } from "../donation-page-shell";
import { StripeNotConnected } from "../stripe-not-connected";
import { CampaignProgress } from "@/components/campaign/campaign-progress";
import type { Locale } from "@/types";

export const revalidate = 300; // ISR: revalidate every 5 minutes

type Props = {
  params: Promise<{ slug: string; campaign: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug, campaign: campaignSlug } = await params;
  const admin = createAdminClient();

  const { data: mosque } = await admin
    .from("mosques")
    .select("id, name, status")
    .eq("slug", slug)
    .single();

  if (!mosque || mosque.status !== "active")
    return { title: "Doneren — Bunyan" };

  const { data: campaign } = await admin
    .from("campaigns")
    .select("title")
    .eq("mosque_id", mosque.id)
    .eq("slug", campaignSlug)
    .eq("is_active", true)
    .single();

  if (!campaign) return { title: `Doneer aan ${mosque.name} — Bunyan` };

  return {
    title: `${campaign.title} — ${mosque.name} — Bunyan`,
    description: `Doe een donatie voor ${campaign.title} bij ${mosque.name} via Bunyan.`,
  };
}

export default async function CampaignDonationPage({ params }: Props) {
  const { slug, campaign: campaignSlug } = await params;
  const admin = createAdminClient();

  const { data: mosque } = await admin
    .from("mosques")
    .select(
      "id, name, slug, primary_color, welcome_msg, logo_url, language, anbi_status, rsin, iban, status, stripe_account_id, stripe_connected_at, contact_email",
    )
    .eq("slug", slug)
    .single();

  if (!mosque || mosque.status !== "active") {
    await redirectIfOldSlug(slug, (s) => `/doneren/${s}/${campaignSlug}`);
    notFound();
  }

  const { data: campaign } = await admin
    .from("campaigns")
    .select("id, title, description, fund_id, goal_amount, slug")
    .eq("mosque_id", mosque.id)
    .eq("slug", campaignSlug)
    .eq("is_active", true)
    .single();

  if (!campaign) notFound();

  // Fetch all active funds (needed for the form)
  const { data: funds } = await admin
    .from("funds")
    .select("id, name, description, icon, goal_amount")
    .eq("mosque_id", mosque.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // Aggregate completed donations per fund
  const { data: fundTotals } = await admin
    .from("donations")
    .select("fund_id, amount")
    .eq("mosque_id", mosque.id)
    .eq("status", "completed");

  const totalsByFund = new Map<string, number>();
  for (const d of fundTotals ?? []) {
    totalsByFund.set(d.fund_id, (totalsByFund.get(d.fund_id) ?? 0) + d.amount);
  }

  const fundsWithProgress = (funds ?? []).map((f) => ({
    ...f,
    raised: totalsByFund.get(f.id) ?? 0,
  }));

  // Calculate campaign-specific progress (only donations through this campaign)
  let raised = 0;
  if (campaign.goal_amount) {
    const { data: campaignDonations } = await admin
      .from("donations")
      .select("amount")
      .eq("mosque_id", mosque.id)
      .eq("campaign_id", campaign.id)
      .eq("status", "completed");

    raised = (campaignDonations ?? []).reduce((sum, d) => sum + d.amount, 0);
  }

  const primaryColor = mosque.primary_color || "#10b981";
  const defaultLocale = (mosque.language as Locale) || "nl";

  if (!mosque.stripe_account_id || !mosque.stripe_connected_at) {
    return (
      <DonationPageShell
        defaultLocale={defaultLocale}
        mosqueName={mosque.name}
        welcomeMsg={mosque.welcome_msg}
        primaryColor={primaryColor}
        logoUrl={mosque.logo_url}
      >
        <StripeNotConnected
          mosqueName={mosque.name}
          logoUrl={mosque.logo_url}
          primaryColor={primaryColor}
          contactEmail={mosque.contact_email}
        />
      </DonationPageShell>
    );
  }

  return (
    <DonationPageShell
      defaultLocale={defaultLocale}
      mosqueName={mosque.name}
      welcomeMsg={mosque.welcome_msg}
      primaryColor={primaryColor}
      logoUrl={mosque.logo_url}
    >
      <div className="mx-auto max-w-lg w-full px-4 pt-4">
        {/* Campaign header */}
        <div className="mb-5 text-center">
          <h2 className="text-[18px] font-bold text-[#261b07]">
            {campaign.title}
          </h2>
          {campaign.description && (
            <p className="mt-1.5 text-[13px] text-[#a09888]">
              {campaign.description}
            </p>
          )}
        </div>

        {campaign.goal_amount && (
          <div className="mb-5">
            <CampaignProgress
              raised={raised}
              goal={campaign.goal_amount}
              primaryColor={primaryColor}
            />
          </div>
        )}
      </div>

      <DonationForm
        mosqueSlug={mosque.slug}
        mosqueName={mosque.name}
        primaryColor={primaryColor}
        welcomeMsg={null}
        logoUrl={mosque.logo_url ?? null}
        funds={fundsWithProgress}
        preselectedFundId={campaign.fund_id}
        campaignId={campaign.id}
        anbiEnabled={!!mosque.anbi_status && !!mosque.rsin}
        mosqueIban={mosque.iban}
        mosqueRsin={mosque.rsin}
      />
    </DonationPageShell>
  );
}
