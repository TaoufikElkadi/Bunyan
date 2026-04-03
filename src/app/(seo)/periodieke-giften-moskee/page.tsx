import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Periodieke giften voor moskeeën",
  description:
    "Ontvang automatische maandelijkse donaties voor uw moskee via SEPA-incasso. Periodieke giften zijn volledig aftrekbaar voor donateurs met ANBI-status. Start gratis met Bunyan.",
  keywords: [
    "periodieke giften moskee",
    "maandelijkse donatie moskee",
    "SEPA incasso moskee",
    "terugkerende donaties moskee",
    "automatische incasso moskee",
    "periodieke gift belastingaftrek moskee",
  ],
  openGraph: {
    title: "Periodieke giften voor moskeeën — Bunyan",
    description:
      "Automatische maandelijkse donaties via SEPA-incasso. Volledig aftrekbaar met ANBI-status.",
    url: "https://bunyan.nl/periodieke-giften-moskee",
  },
  alternates: {
    canonical: "https://bunyan.nl/periodieke-giften-moskee",
  },
}

export default function PeriodiekGiftenMoskeePage() {
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
          Periodieke giften voor moskeeën: stabiele inkomsten en belastingvoordeel
        </h1>

        <p className="text-lg text-[#261b07]/80 mb-8 leading-relaxed">
          Eenmalige donaties zijn waardevol, maar <strong>periodieke giften</strong> vormen het financiële fundament van een gezonde moskee. Met maandelijkse automatische incasso via Bunyan bouwt u aan een voorspelbare inkomstenstroom — en bieden uw donateurs tegelijkertijd een aantrekkelijk belastingvoordeel.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Wat zijn periodieke giften?
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Een periodieke gift is een donatie die een donateur gedurende minimaal 5 jaar regelmatig (meestal maandelijks) doet aan een ANBI-instelling. Het grote voordeel: periodieke giften zijn <strong>volledig aftrekbaar</strong> van de inkomstenbelasting, zonder drempelbedrag. Bij een eenmalige gift geldt een drempel van 1% van het verzamelinkomen — bij periodieke giften niet. Dit maakt het voor donateurs aantrekkelijk om structureel te geven.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Hoe werkt het met Bunyan?
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Op uw <Link href="/online-doneren-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">donatiepagina</Link> kunnen gemeenteleden kiezen voor een maandelijkse periodieke gift. Ze vullen het gewenste bedrag in en geven toestemming voor automatische incasso via SEPA. Vanaf dat moment int Bunyan het bedrag elke maand automatisch. Donateurs beheren hun eigen abonnement: ze kunnen het bedrag aanpassen, pauzeren of op elk moment stopzetten via een persoonlijke link.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Belastingvoordeel voor donateurs
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Als uw moskee een ANBI-status heeft, mogen donateurs hun periodieke giften volledig aftrekken van de belasting. Stel: een donateur geeft €50 per maand aan uw moskee (€600 per jaar). Bij een marginaal belastingtarief van 37% krijgt de donateur €222 terug van de Belastingdienst. De netto kosten zijn dan slechts €378 — terwijl uw moskee het volledige bedrag ontvangt. Bunyan genereert aan het einde van elk jaar automatisch een <Link href="/anbi-giftenverklaring-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">ANBI-giftenverklaring</Link> die de donateur kan gebruiken bij de aangifte.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Voorspelbare inkomsten voor uw moskee
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Het grootste voordeel voor moskeeën: voorspelbaarheid. Met 50 donateurs die elk €25 per maand geven, ontvangt uw moskee gegarandeerd €1.250 per maand — ongeacht of het Ramadan is of een rustige zomermaand. Dat geeft uw bestuur de zekerheid om vooruit te plannen: onderhoud, activiteiten, personeel. In uw <Link href="/donatiebeheer-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">dashboard</Link> ziet u in één oogopslag hoeveel periodieke giften actief zijn, wat het maandelijkse totaal is en welke donateurs recent zijn gestopt.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          SEPA-incasso: veilig en betrouwbaar
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Alle periodieke giften verlopen via SEPA Direct Debit — het Europese standaardsysteem voor automatische incasso. Donateurs geven eenmalig een machtiging af en de betalingen worden automatisch verwerkt door Stripe. Donateurs ontvangen vooraf een notificatie en hebben altijd recht op terugboeking binnen 8 weken, conform de SEPA-regels.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Combineer met eenmalige donaties en QR-codes
        </h2>
        <p className="text-[#261b07]/80 mb-8 leading-relaxed">
          Periodieke giften staan niet op zichzelf. Combineer ze met eenmalige iDEAL-donaties voor speciale campagnes en <Link href="/qr-code-donatie-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">QR-codes</Link> in de moskee voor spontane giften. Alle donaties — eenmalig en periodiek — komen samen in uw Bunyan-dashboard, gekoppeld aan <Link href="/ledenbeheer-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">donorprofielen</Link> voor een compleet overzicht van uw gemeenschap.
        </p>

        {/* CTA */}
        <div className="rounded-2xl bg-[#261b07] p-8 text-center">
          <h2 className="text-xl font-semibold text-[#f8f7f5] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            Bouw aan stabiele inkomsten voor uw moskee
          </h2>
          <p className="text-[#f8f7f5]/70 mb-6 text-sm">
            Start gratis met Bunyan en activeer periodieke giften voor uw gemeenschap.
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
              <Link href="/qr-code-donatie-moskee" className="text-[15px] text-[#261b07] hover:opacity-60 transition-opacity">
                QR-code donatiepagina voor moskeeën
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
