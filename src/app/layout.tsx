import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Outfit } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
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
  metadataBase: new URL("https://bunyan.nl"),
  title: {
    default: "Bunyan — Moskee software voor donaties, ANBI & ledenbeheer",
    template: "%s | Bunyan — Moskee Software",
  },
  description:
    "Bunyan is hét platform waarmee moskeeën in Nederland donaties beheren, ANBI-giftenverklaringen genereren en hun gemeenschap in kaart brengen. Moskee software voor donatiebeheer, ledenbeheer en belastingaftrek.",
  keywords: [
    "moskee software",
    "donatie beheer moskee",
    "ANBI giftenverklaring moskee",
    "ledenbeheer moskee",
    "iDEAL donaties moskee",
    "online doneren moskee",
    "ANBI status moskee",
    "belastingaftrek donatie moskee",
    "donorbeheer moskee",
    "CRM moskee",
  ],
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: "https://bunyan.nl",
    siteName: "Bunyan",
    title: "Bunyan — Moskee software voor donaties, ANBI & ledenbeheer",
    description:
      "Hét platform waarmee moskeeën in Nederland donaties beheren, ANBI-giftenverklaringen genereren en hun gemeenschap in kaart brengen.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Bunyan — Moskee software",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bunyan — Moskee software voor donaties, ANBI & ledenbeheer",
    description:
      "Hét platform waarmee moskeeën in Nederland donaties beheren, ANBI-giftenverklaringen genereren en hun gemeenschap in kaart brengen.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://bunyan.nl",
  },
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
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Bunyan",
                url: "https://bunyan.nl",
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Bunyan",
                url: "https://bunyan.nl",
                logo: "https://bunyan.nl/logos/logo_transparent.svg",
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "Bunyan",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                description:
                  "Moskee software voor donatiebeheer, ANBI-giftenverklaringen en ledenbeheer in Nederland.",
                offers: [
                  {
                    "@type": "Offer",
                    name: "Gratis",
                    price: "0",
                    priceCurrency: "EUR",
                    description: "Gratis plan voor kleine moskeeën",
                  },
                  {
                    "@type": "Offer",
                    name: "Pro",
                    price: "49",
                    priceCurrency: "EUR",
                    description: "Professioneel plan met alle functies",
                    priceSpecification: {
                      "@type": "UnitPriceSpecification",
                      price: "49",
                      priceCurrency: "EUR",
                      billingDuration: "P1M",
                    },
                  },
                ],
              },
            ]),
          }}
        />
      </head>
      <body className={`${plusJakarta.variable} ${outfit.variable} ${plusJakarta.className} antialiased`} suppressHydrationWarning>
        {children}
        <Toaster position="top-right" duration={5000} />
      </body>
    </html>
  )
}
