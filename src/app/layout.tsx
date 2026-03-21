import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Outfit } from "next/font/google"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  variable: "--font-display",
})

export const metadata: Metadata = {
  title: "Bunyan — Moskee software voor donaties, ANBI & ledenbeheer",
  description: "Bunyan is hét platform waarmee moskeeën in Nederland donaties beheren, ANBI-giftenverklaringen genereren en hun gemeenschap in kaart brengen. Start gratis met iDEAL, periodieke giften en donorprofielen.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl">
      <head>
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Bunyan",
              url: "https://bunyan.nl",
            }),
          }}
        />
      </head>
      <body className={`${plusJakarta.variable} ${outfit.variable} ${plusJakarta.className} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
