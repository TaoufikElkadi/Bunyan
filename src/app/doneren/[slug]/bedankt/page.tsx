import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { redirectIfOldSlug } from '@/lib/slug-redirect'
import { BedanktContent } from './bedankt-content'
import type { Locale } from '@/types'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function BedanktPage({ params }: Props) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: mosque } = await admin
    .from('mosques')
    .select('name, language, primary_color, status')
    .eq('slug', slug)
    .single()

  if (!mosque || mosque.status !== 'active') {
    await redirectIfOldSlug(slug, (s) => `/doneren/${s}/bedankt`)
    notFound()
  }

  const defaultLocale = (mosque.language as Locale) || 'nl'

  return (
    <BedanktContent
      defaultLocale={defaultLocale}
      mosqueName={mosque.name}
      mosqueSlug={slug}
    />
  )
}
