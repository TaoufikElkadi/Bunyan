import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "ANBI-giftenverklaring voor moskeeën",
  description:
    "Genereer automatisch ANBI-giftenverklaringen voor uw moskee. Voldoe aan de eisen van de Belastingdienst en bied donateurs belastingaftrek. Start gratis met Bunyan.",
  keywords: [
    "ANBI giftenverklaring moskee",
    "ANBI status moskee",
    "belastingaftrek donatie moskee",
    "giftenverklaring genereren",
    "Belastingdienst moskee",
  ],
  openGraph: {
    title: "ANBI-giftenverklaring voor moskeeën — Bunyan",
    description:
      "Genereer automatisch ANBI-giftenverklaringen. Voldoe aan de eisen van de Belastingdienst en bied donateurs belastingaftrek.",
    url: "https://bunyan.nl/anbi-giftenverklaring-moskee",
  },
  alternates: {
    canonical: "https://bunyan.nl/anbi-giftenverklaring-moskee",
  },
}

export default function AnbiGiftenverklaringMoskeePage() {
  return (
    <div className="min-h-screen bg-[#f8f7f5] text-[#261b07]" style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
      {/* Nav */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-[#f8f7f5]/95 backdrop-blur-md border-b border-[#e3dfd5]/60 max-w-5xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logos/logo_transparent.svg" alt="" width={24} height={24} className="h-6 w-6" />
          <span className="text-[16px] font-semibold tracking-tight text-[#261b07] uppercase" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            bunyan
          </span>
        </Link>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-lg bg-[#261b07] px-5 py-2.5 text-[13px] font-semibold text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors"
        >
          Gratis starten
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          ANBI-giftenverklaring voor moskeeën automatisch genereren
        </h1>

        <p className="text-lg text-[#261b07]/80 mb-8 leading-relaxed">
          Als uw moskee een <strong>ANBI-status</strong> heeft, mogen donateurs hun giften aftrekken van de belasting. Maar dan moeten zij wel een correcte giftenverklaring ontvangen. Bunyan automatiseert dit volledige proces — van donatie tot PDF.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Wat is een ANBI-giftenverklaring?
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Een ANBI-giftenverklaring is een officieel document waarmee donateurs aan de Belastingdienst aantonen dat zij een gift hebben gedaan aan een Algemeen Nut Beogende Instelling (ANBI). Het document moet voldoen aan specifieke eisen: het bevat de naam en het RSIN van de instelling, de naam en adresgegevens van de donateur, het bedrag, de datum en of het een periodieke of eenmalige gift betreft.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Automatisch genereren met Bunyan
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          In Bunyan voert u eenmalig uw ANBI-gegevens in (RSIN, KvK-nummer, vestigingsadres). Daarna genereert het systeem per donateur een giftenverklaring over het gekozen jaar. De PDF volgt het format dat de Belastingdienst vereist, inclusief alle verplichte velden. U kunt de verklaringen per stuk downloaden of in bulk versturen naar alle donateurs.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Periodieke giften en belastingaftrek
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Periodieke giften (minimaal 5 jaar, vastgelegd in een overeenkomst) zijn volledig aftrekbaar — zonder drempelbedrag. Bunyan ondersteunt <Link href="/donatiebeheer-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">periodieke giften via automatische incasso</Link> en houdt bij welke donateurs in aanmerking komen. De giftenverklaring vermeldt automatisch of het een periodieke of eenmalige gift betreft.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Altijd compliant, zonder extra werk
        </h2>
        <p className="text-[#261b07]/80 mb-8 leading-relaxed">
          Geen Excel-bestanden meer bijhouden of handmatig brieven opmaken. Bunyan koppelt elke donatie aan het juiste <Link href="/ledenbeheer-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">donorprofiel</Link>, berekent de jaartotalen en produceert kant-en-klare verklaringen. Uw penningmeester bespaart uren werk aan het einde van elk boekjaar.
        </p>

        {/* CTA */}
        <div className="rounded-2xl bg-[#261b07] p-8 text-center">
          <h2 className="text-xl font-semibold text-[#f8f7f5] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            ANBI-giftenverklaringen in een paar klikken
          </h2>
          <p className="text-[#f8f7f5]/70 mb-6 text-sm">
            Voer uw ANBI-gegevens in en Bunyan doet de rest. Gratis te proberen.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-[#c6e535] px-6 py-3 text-[14px] font-semibold text-[#2a3800] hover:bg-[#b8d62e] transition-colors"
          >
            Gratis account aanmaken
          </Link>
        </div>

        {/* Internal links */}
        <nav className="mt-12 pt-8 border-t border-[#e3dfd5]">
          <p className="text-sm font-medium text-[#261b07]/50 mb-3">Meer over Bunyan</p>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="text-[15px] text-[#261b07] hover:opacity-60 transition-opacity">
                Terug naar homepage
              </Link>
            </li>
            <li>
              <Link href="/donatiebeheer-moskee" className="text-[15px] text-[#261b07] hover:opacity-60 transition-opacity">
                Donatiebeheer voor moskeeën
              </Link>
            </li>
            <li>
              <Link href="/ledenbeheer-moskee" className="text-[15px] text-[#261b07] hover:opacity-60 transition-opacity">
                Ledenbeheer voor moskeeën
              </Link>
            </li>
          </ul>
        </nav>
      </main>
    </div>
  )
}
