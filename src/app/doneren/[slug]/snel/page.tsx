import type { Viewport } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { redirectIfOldSlug } from '@/lib/slug-redirect'
import { DonationPageShell } from '../donation-page-shell'
import { SnelDonationForm } from './snel-donation-form'
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
    title: `Snel doneren — ${mosque.name} — Bunyan`,
    description: `Doe snel een donatie aan ${mosque.name} via Bunyan.`,
  }
}

export default async function SnelDonerenPage({ params }: Props) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: mosque } = await admin
    .from('mosques')
    .select('id, name, slug, primary_color, logo_url, language, status')
    .eq('slug', slug)
    .single()

  if (!mosque || mosque.status !== 'active') {
    await redirectIfOldSlug(slug, (s) => `/doneren/${s}/snel`)
    notFound()
  }

  const { data: funds } = await admin
    .from('funds')
    .select('id, name')
    .eq('mosque_id', mosque.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const defaultLocale = (mosque.language as Locale) || 'nl'

  return (
    <DonationPageShell
      defaultLocale={defaultLocale}
      mosqueName={mosque.name}
      welcomeMsg={null}
      primaryColor={mosque.primary_color || undefined}
      logoUrl={mosque.logo_url}
    >
      <SnelDonationForm
        mosqueSlug={mosque.slug}
        mosqueName={mosque.name}
        primaryColor={mosque.primary_color || '#6B5E4C'}
        funds={(funds ?? []).map((f) => ({ id: f.id, name: f.name }))}
      />
    </DonationPageShell>
  )
}
