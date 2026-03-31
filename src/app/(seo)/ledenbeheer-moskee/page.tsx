import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Ledenbeheer voor moskeeën",
  description:
    "Ledenbeheer en donorbeheer voor moskeeën. Houd overzicht over uw gemeenteleden, donateurs en contributies. CRM speciaal voor moskeeën. Start gratis met Bunyan.",
  keywords: [
    "ledenbeheer moskee",
    "donorbeheer moskee",
    "CRM moskee",
    "ledenadministratie moskee",
    "gemeentebeheer moskee",
  ],
  openGraph: {
    title: "Ledenbeheer voor moskeeën — Bunyan",
    description:
      "Houd overzicht over uw gemeenteleden, donateurs en contributies. CRM speciaal voor moskeeën.",
    url: "https://bunyan.nl/ledenbeheer-moskee",
  },
  alternates: {
    canonical: "https://bunyan.nl/ledenbeheer-moskee",
  },
}

export default function LedenbeheerMoskeePage() {
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
          Ledenbeheer en donorbeheer voor moskeeën
        </h1>

        <p className="text-lg text-[#261b07]/80 mb-8 leading-relaxed">
          Een moskee is meer dan een gebedshuis — het is een gemeenschap. Maar wie zijn uw donateurs eigenlijk? Hoeveel hebben zij dit jaar gedoneerd? En wie ontvangt er een <Link href="/anbi-giftenverklaring-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">ANBI-giftenverklaring</Link>? Bunyan brengt uw <strong>leden- en donoradministratie</strong> samen op één plek.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Automatische donorprofielen
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Elke donatie die via Bunyan binnenkomt, wordt automatisch gekoppeld aan een donorprofiel op basis van e-mailadres. U ziet per persoon een compleet overzicht: totale donaties, favoriete fondsen, actieve periodieke giften en de status van hun giftenverklaring. Geen handmatig invoerwerk meer.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Contributiebeheer
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Veel moskeeën werken met een vaste maandelijkse contributie voor leden. Bunyan houdt bij wie lid is, wat hun contributie bedraagt, en of deze is voldaan. Combineer contributie-inkomsten met <Link href="/donatiebeheer-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">losse donaties</Link> voor een compleet financieel overzicht.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Zoeken, filteren en exporteren
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Zoek snel een specifieke donateur, filter op donatieperiode of fonds, en exporteer gegevens naar Excel. Of u nu uw jaarverslag voorbereidt, de contributie-inning controleert of een overzicht nodig heeft voor het bestuur — de data is altijd beschikbaar en actueel.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Privacy en AVG-compliance
        </h2>
        <p className="text-[#261b07]/80 mb-8 leading-relaxed">
          Persoonsgegevens van uw gemeenteleden worden opgeslagen in de EU en beschermd conform de AVG. Bunyan slaat alleen de gegevens op die nodig zijn voor donatiebeheer en giftenverklaringen. Donateurs kunnen op elk moment inzage vragen of hun gegevens laten verwijderen.
        </p>

        {/* CTA */}
        <div className="rounded-2xl bg-[#261b07] p-8 text-center">
          <h2 className="text-xl font-semibold text-[#f8f7f5] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            Breng uw gemeenschap in kaart
          </h2>
          <p className="text-[#f8f7f5]/70 mb-6 text-sm">
            Van losse donateur tot trouw lid — Bunyan houdt het overzicht. Gratis te proberen.
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
              <Link href="/anbi-giftenverklaring-moskee" className="text-[15px] text-[#261b07] hover:opacity-60 transition-opacity">
                ANBI-giftenverklaringen voor moskeeën
              </Link>
            </li>
          </ul>
        </nav>
      </main>
    </div>
  )
}
