import type { Viewport } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { DonationForm } from './donation-form'
import { DonationPageShell } from './donation-page-shell'
import type { Locale } from '@/types'

export const revalidate = 300 // ISR: revalidate every 5 minutes

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const admin = createAdminClient()
  const { data: mosque } = await admin
    .from('mosques')
    .select('name, status')
    .eq('slug', slug)
    .single()

  if (!mosque || mosque.status !== 'active') return { title: 'Doneren — Bunyan' }

  return {
    title: `Doneer aan ${mosque.name} — Bunyan`,
    description: `Doe een donatie aan ${mosque.name} via Bunyan.`,
  }
}

export default async function DonerenPage({ params }: Props) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: mosque } = await admin
    .from('mosques')
    .select('id, name, slug, primary_color, welcome_msg, logo_url, language, anbi_status, rsin, status')
    .eq('slug', slug)
    .single()

  if (!mosque || mosque.status !== 'active') notFound()

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

  const defaultLocale = (mosque.language as Locale) || 'nl'

  return (
    <DonationPageShell
      defaultLocale={defaultLocale}
      mosqueName={mosque.name}
      welcomeMsg={mosque.welcome_msg}
      primaryColor={mosque.primary_color || undefined}
      logoUrl={mosque.logo_url}
    >
      <DonationForm
        mosqueSlug={mosque.slug}
        mosqueName={mosque.name}
        primaryColor={mosque.primary_color || '#6B5E4C'}
        welcomeMsg={mosque.welcome_msg}
        logoUrl={mosque.logo_url}
        funds={fundsWithProgress}
        anbiEnabled={!!mosque.anbi_status && !!mosque.rsin}
      />
    </DonationPageShell>
  )
}
