import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
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
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
