import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/login',
          '/signup',
          '/forgot-password',
          '/set-password',
          '/onboarding/',
          '/admin/',
          '/anbi/',
          '/audit/',
          '/campagnes/',
          '/collecte/',
          '/contributie/',
          '/donateurs/',
          '/donaties/',
          '/fondsen/',
          '/instellingen/',
          '/leden/',
          '/qr/',
          '/annuleren/',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://bunyan.nl/sitemap.xml',
  }
}
