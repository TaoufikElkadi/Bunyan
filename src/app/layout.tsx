import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
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
      <body className={`${plusJakarta.variable} ${plusJakarta.className} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
