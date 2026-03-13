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
  title: "Bunyan — Donatiebeheer voor moskeeën",
  description: "Alles-in-één platform voor moskee donatiebeheer, ANBI-giftenverklaringen en donateursbeheer.",
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
      </head>
      <body className={`${plusJakarta.variable} ${outfit.variable} ${plusJakarta.className} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
