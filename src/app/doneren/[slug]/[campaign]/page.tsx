import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { DonationForm } from '../donation-form'
import { CampaignProgress } from '@/components/campaign/campaign-progress'

export const revalidate = 300 // ISR: revalidate every 5 minutes

type Props = {
  params: Promise<{ slug: string; campaign: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug, campaign: campaignSlug } = await params
  const admin = createAdminClient()

  const { data: mosque } = await admin
    .from('mosques')
    .select('id, name, status')
    .eq('slug', slug)
    .single()

  if (!mosque || mosque.status !== 'active') return { title: 'Doneren — Bunyan' }

  const { data: campaign } = await admin
    .from('campaigns')
    .select('title')
    .eq('mosque_id', mosque.id)
    .eq('slug', campaignSlug)
    .eq('is_active', true)
    .single()

  if (!campaign) return { title: `Doneer aan ${mosque.name} — Bunyan` }

  return {
    title: `${campaign.title} — ${mosque.name} — Bunyan`,
    description: `Doe een donatie voor ${campaign.title} bij ${mosque.name} via Bunyan.`,
  }
}

export default async function CampaignDonationPage({ params }: Props) {
  const { slug, campaign: campaignSlug } = await params
  const admin = createAdminClient()

  const { data: mosque } = await admin
    .from('mosques')
    .select('id, name, slug, primary_color, welcome_msg, logo_url, status')
    .eq('slug', slug)
    .single()

  if (!mosque || mosque.status !== 'active') notFound()

  const { data: campaign } = await admin
    .from('campaigns')
    .select('id, title, description, fund_id, goal_amount, slug')
    .eq('mosque_id', mosque.id)
    .eq('slug', campaignSlug)
    .eq('is_active', true)
    .single()

  if (!campaign) notFound()

  // Fetch all active funds (needed for the form)
  const { data: funds } = await admin
    .from('funds')
    .select('id, name, description, icon, goal_amount')
    .eq('mosque_id', mosque.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  // Aggregate completed donations per fund
  const { data: fundTotals } = await admin
    .from('donations')
    .select('fund_id, amount')
    .eq('mosque_id', mosque.id)
    .eq('status', 'completed')

  const totalsByFund = new Map<string, number>()
  for (const d of fundTotals ?? []) {
    totalsByFund.set(d.fund_id, (totalsByFund.get(d.fund_id) ?? 0) + d.amount)
  }

  const fundsWithProgress = (funds ?? []).map((f) => ({
    ...f,
    raised: totalsByFund.get(f.id) ?? 0,
  }))

  // Calculate campaign progress
  let raised = 0
  if (campaign.goal_amount && campaign.fund_id) {
    raised = totalsByFund.get(campaign.fund_id) ?? 0
  }

  const primaryColor = mosque.primary_color || '#10b981'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-6 md:py-12">
        <div className="mb-6 md:mb-8 text-center">
          <h1
            className="text-2xl md:text-3xl font-bold"
            style={{ color: primaryColor }}
          >
            {mosque.name}
          </h1>
          <h2 className="mt-2 text-lg md:text-xl font-semibold">{campaign.title}</h2>
          {campaign.description && (
            <p className="mt-2 text-sm md:text-base text-muted-foreground">{campaign.description}</p>
          )}
        </div>

        {campaign.goal_amount && (
          <div className="mb-6">
            <CampaignProgress
              raised={raised}
              goal={campaign.goal_amount}
              primaryColor={primaryColor}
            />
          </div>
        )}

        <DonationForm
          mosqueSlug={mosque.slug}
          mosqueName={mosque.name}
          primaryColor={primaryColor}
          welcomeMsg={mosque.welcome_msg ?? null}
          logoUrl={mosque.logo_url ?? null}
          funds={fundsWithProgress}
          preselectedFundId={campaign.fund_id}
        />
      </div>
    </div>
  )
}
