import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

const BASE_URL = 'https://bunyan.nl'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient()

  // Fetch active mosques
  const { data: mosques } = await admin
    .from('mosques')
    .select('slug, updated_at')
    .eq('status', 'active')

  // Fetch active campaigns for active mosques
  const { data: campaigns } = await admin
    .from('campaigns')
    .select('slug, updated_at, mosques!inner(slug, status)')
    .eq('status', 'active')
    .eq('mosques.status', 'active')

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]

  // Donation pages per mosque
  const mosquePages: MetadataRoute.Sitemap = (mosques ?? []).map((mosque) => ({
    url: `${BASE_URL}/doneren/${mosque.slug}`,
    lastModified: new Date(mosque.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Campaign pages
  const campaignPages: MetadataRoute.Sitemap = (campaigns ?? []).map((campaign) => {
    const mosqueSlug = (campaign.mosques as unknown as { slug: string }).slug
    return {
      url: `${BASE_URL}/doneren/${mosqueSlug}/${campaign.slug}`,
      lastModified: new Date(campaign.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }
  })

  return [...staticPages, ...mosquePages, ...campaignPages]
}
