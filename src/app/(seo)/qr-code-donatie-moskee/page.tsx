import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "QR-code donatiepagina voor moskeeën",
  description:
    "Genereer een QR-code voor uw moskee-donatiepagina. Gemeenteleden scannen de code en doneren direct via iDEAL. Ideaal voor collectes, posters en flyers. Gratis met Bunyan.",
  keywords: [
    "QR-code donatie moskee",
    "QR-code collecte moskee",
    "digitale collecte moskee",
    "QR doneren moskee",
    "contactloos doneren moskee",
    "moskee donatiepagina QR",
  ],
  openGraph: {
    title: "QR-code donatiepagina voor moskeeën — Bunyan",
    description:
      "Genereer een QR-code voor uw moskee. Gemeenteleden scannen en doneren direct via iDEAL.",
    url: "https://bunyan.nl/qr-code-donatie-moskee",
  },
  alternates: {
    canonical: "https://bunyan.nl/qr-code-donatie-moskee",
  },
}

export default function QrCodeDonatieMoskeePage() {
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
          QR-code donatiepagina voor uw moskee
        </h1>

        <p className="text-lg text-[#261b07]/80 mb-8 leading-relaxed">
          De collectezak wordt digitaal. Met een <strong>QR-code van Bunyan</strong> kunnen gemeenteleden tijdens het vrijdaggebed hun telefoon pakken, de code scannen en direct doneren via iDEAL. Geen contant geld nodig, geen gedoe met pinautomaten — gewoon scannen en doneren.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Hoe werkt de QR-code?
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Zodra u zich aanmeldt bij Bunyan ontvangt uw moskee een eigen donatiepagina met een unieke URL. Bunyan genereert automatisch een QR-code die naar deze pagina verwijst. Gemeenteleden scannen de QR-code met de camera van hun telefoon (iPhone of Android), worden doorgestuurd naar uw donatiepagina en kunnen direct een bedrag kiezen en betalen via <Link href="/online-doneren-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">iDEAL</Link>. Het hele proces duurt minder dan 30 seconden.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Waar kunt u de QR-code gebruiken?
        </h2>
        <p className="text-[#261b07]/80 mb-4 leading-relaxed">
          De mogelijkheden zijn eindeloos. Moskeeën gebruiken de Bunyan QR-code op:
        </p>
        <ul className="list-disc pl-6 text-[#261b07]/80 mb-6 space-y-2 leading-relaxed">
          <li><strong>Posters bij de ingang</strong> — donateurs scannen bij binnenkomst of vertrek</li>
          <li><strong>Schermen in de gebedsruimte</strong> — toon de QR-code op een TV of beamer tijdens aankondigingen</li>
          <li><strong>Flyers en nieuwsbrieven</strong> — print de QR-code op papieren communicatie</li>
          <li><strong>Ramadan-campagnes</strong> — maak een aparte QR-code per fonds of campagne</li>
          <li><strong>Sociale media</strong> — deel de QR-code als afbeelding op WhatsApp, Instagram of Facebook</li>
          <li><strong>Visitekaartjes van bestuursleden</strong> — altijd een donatiemogelijkheid bij de hand</li>
        </ul>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Fondsen en campagnes via QR
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Met Bunyan kunt u meerdere QR-codes aanmaken die elk naar een specifiek fonds of campagne leiden. Zo maakt u een aparte QR-code voor uw bouwfonds, een voor de Ramadan-actie en een voor algemene donaties. Donateurs komen direct op de juiste pagina terecht, zonder zelf een fonds te hoeven selecteren. In uw <Link href="/donatiebeheer-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">dashboard</Link> ziet u precies hoeveel donaties er per QR-code binnenkomen.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Scan-analyse en inzicht
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Bunyan houdt bij hoeveel keer elke QR-code wordt gescand en hoeveel van die scans tot een daadwerkelijke donatie leiden. Zo weet u welke locaties en campagnes het meeste opleveren. Hang de QR-code op twee plekken op en vergelijk na een maand welke plek beter presteert — data-gedreven beslissingen voor uw moskee.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Van contant naar digitaal
        </h2>
        <p className="text-[#261b07]/80 mb-8 leading-relaxed">
          De overgang van contante collectes naar digitale donaties hoeft niet abrupt te zijn. Veel moskeeën gebruiken de QR-code naast de traditionele collectezak. Geleidelijk merken ze dat steeds meer gemeenteleden het digitale alternatief verkiezen. Het voordeel: elke digitale donatie wordt automatisch geadministreerd, gekoppeld aan een <Link href="/ledenbeheer-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">donorprofiel</Link> en meegenomen in de <Link href="/anbi-giftenverklaring-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">ANBI-giftenverklaring</Link> aan het einde van het jaar.
        </p>

        {/* CTA */}
        <div className="rounded-2xl bg-[#261b07] p-8 text-center">
          <h2 className="text-xl font-semibold text-[#f8f7f5] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            Genereer uw QR-code in 5 minuten
          </h2>
          <p className="text-[#f8f7f5]/70 mb-6 text-sm">
            Maak een gratis account aan en uw donatie-QR-code is direct klaar om te printen.
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
              <Link href="/online-doneren-moskee" className="text-[15px] text-[#261b07] hover:opacity-60 transition-opacity">
                Online doneren voor moskeeën via iDEAL
              </Link>
            </li>
            <li>
              <Link href="/donatiebeheer-moskee" className="text-[15px] text-[#261b07] hover:opacity-60 transition-opacity">
                Donatiebeheer voor moskeeën
              </Link>
            </li>
            <li>
              <Link href="/periodieke-giften-moskee" className="text-[15px] text-[#261b07] hover:opacity-60 transition-opacity">
                Periodieke giften voor moskeeën
              </Link>
            </li>
            <li>
              <Link href="/anbi-giftenverklaring-moskee" className="text-[15px] text-[#261b07] hover:opacity-60 transition-opacity">
                ANBI-giftenverklaringen voor moskeeën
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
