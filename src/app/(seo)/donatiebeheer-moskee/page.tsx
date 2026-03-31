import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Donatiebeheer voor moskeeën",
  description:
    "Donatie software voor moskeeën. Ontvang online donaties via iDEAL, beheer periodieke giften en houd overzicht met automatische rapportages. Start gratis met Bunyan.",
  keywords: [
    "donatie software moskee",
    "iDEAL donaties moskee",
    "online doneren moskee",
    "donatiebeheer moskee",
    "periodieke giften moskee",
  ],
  openGraph: {
    title: "Donatiebeheer voor moskeeën — Bunyan",
    description:
      "Ontvang online donaties via iDEAL, beheer periodieke giften en houd overzicht met automatische rapportages.",
    url: "https://bunyan.nl/donatiebeheer-moskee",
  },
  alternates: {
    canonical: "https://bunyan.nl/donatiebeheer-moskee",
  },
}

export default function DonatiebeheerMoskeePage() {
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
          Donatiebeheer voor moskeeën met iDEAL & online doneren
        </h1>

        <p className="text-lg text-[#261b07]/80 mb-8 leading-relaxed">
          Veel moskeeën vertrouwen nog op contante collectes en handmatige administratie. Dat kost tijd, is foutgevoelig en mist kansen. Bunyan biedt een <strong>moderne donatie-oplossing speciaal voor moskeeën in Nederland</strong>.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Online donaties via iDEAL
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Met Bunyan kunnen gemeenteleden eenvoudig doneren via iDEAL, de meest gebruikte betaalmethode in Nederland. Elke moskee krijgt een eigen donatiepagina die u kunt delen via uw website, sociale media of een QR-code in de moskee. Donateurs hoeven geen account aan te maken — een donatie doen duurt minder dan een minuut.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Periodieke giften en abonnementen
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Stimuleer terugkerende donaties met automatische periodieke giften via SEPA-incasso. Donateurs stellen zelf hun maandelijkse bijdrage in en kunnen deze op elk moment pauzeren of stopzetten. Dit zorgt voor voorspelbare inkomsten voor uw moskee en maakt donateurs bovendien in aanmerking voor belastingaftrek als uw moskee ANBI-status heeft.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Automatische rapportages en overzicht
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Alle donaties worden automatisch verwerkt en gekoppeld aan donorprofielen. U ziet in één oogopslag hoeveel er is gedoneerd, aan welk fonds, en door wie. Exporteer gegevens naar Excel voor uw administratie of genereer direct een <Link href="/anbi-giftenverklaring-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">ANBI-giftenverklaring</Link> voor uw donateurs.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Meerdere fondsen en campagnes
        </h2>
        <p className="text-[#261b07]/80 mb-8 leading-relaxed">
          Maak onderscheid tussen algemene donaties, bouwfondsen, Ramadan-acties of andere doelen. Donateurs kiezen zelf waar hun gift naartoe gaat. Elk fonds heeft zijn eigen overzicht en rapportage. Combineer dit met <Link href="/ledenbeheer-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">ledenbeheer</Link> voor een compleet beeld van uw gemeenschap.
        </p>

        {/* CTA */}
        <div className="rounded-2xl bg-[#261b07] p-8 text-center">
          <h2 className="text-xl font-semibold text-[#f8f7f5] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            Start vandaag gratis met Bunyan
          </h2>
          <p className="text-[#f8f7f5]/70 mb-6 text-sm">
            Geen creditcard nodig. Binnen 5 minuten uw eerste donatiepagina live.
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
