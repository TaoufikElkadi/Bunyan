import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Online doneren voor moskeeën via iDEAL",
  description:
    "Laat gemeenteleden online doneren aan uw moskee via iDEAL. Eigen donatiepagina, geen account nodig voor donateurs, direct geld op uw rekening. Start gratis met Bunyan.",
  keywords: [
    "online doneren moskee",
    "iDEAL donatie moskee",
    "donatiepagina moskee",
    "digitaal doneren moskee",
    "online giften moskee",
    "moskee iDEAL betaling",
  ],
  openGraph: {
    title: "Online doneren voor moskeeën via iDEAL — Bunyan",
    description:
      "Laat gemeenteleden online doneren aan uw moskee via iDEAL. Eigen donatiepagina, direct geld op uw rekening.",
    url: "https://bunyan.nl/online-doneren-moskee",
  },
  alternates: {
    canonical: "https://bunyan.nl/online-doneren-moskee",
  },
}

export default function OnlineDonerenMoskeePage() {
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
          Online doneren voor moskeeën via iDEAL
        </h1>

        <p className="text-lg text-[#261b07]/80 mb-8 leading-relaxed">
          Steeds meer moskeeën in Nederland stappen over van contante collectes naar <strong>online donaties via iDEAL</strong>. Dat is logisch: het is veiliger, sneller en bereikt ook gemeenteleden die niet elke vrijdag fysiek aanwezig zijn. Met Bunyan zet u in een paar minuten een professionele donatiepagina op voor uw moskee.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Waarom online doneren via iDEAL?
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          iDEAL is de meest gebruikte online betaalmethode in Nederland — meer dan 70% van alle online betalingen verloopt via iDEAL. Uw donateurs kennen het, vertrouwen het, en hebben het al op hun telefoon. Een donatie via iDEAL is direct verwerkt: geen wachttijden, geen handmatige administratie, geen telfouten. Het geld staat dezelfde dag op uw rekening via Stripe, de betaalverwerker achter Bunyan.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Uw eigen donatiepagina
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Elke moskee die zich aanmeldt bij Bunyan krijgt een eigen donatiepagina: <strong>bunyan.nl/doneren/uw-moskee</strong>. Deze pagina is geoptimaliseerd voor mobiel, laadt razendsnel en werkt zonder dat donateurs een account hoeven aan te maken. Donateurs kiezen een bedrag, selecteren optioneel een fonds (zoals bouwfonds, Ramadan-actie of algemeen), en betalen direct via iDEAL. De hele flow duurt minder dan 30 seconden.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Deel uw donatiepagina overal
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          U kunt uw donatiepagina delen via WhatsApp, sociale media, uw eigen website of een <Link href="/qr-code-donatie-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">QR-code in de moskee</Link>. Hang de QR-code op bij de ingang, in de gebedsruimte of op de prikbord — gemeenteleden scannen de code met hun telefoon en doneren direct. Zo combineert u het gemak van digitaal betalen met de fysieke aanwezigheid in de moskee.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Automatische administratie
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Elke online donatie wordt automatisch verwerkt in uw <Link href="/donatiebeheer-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">donatiebeheer-dashboard</Link>. Bunyan maakt automatisch een donorprofiel aan op basis van het e-mailadres van de donateur. U ziet precies wie wat heeft gedoneerd, aan welk fonds, en wanneer. Aan het einde van het jaar genereert u met één klik een <Link href="/anbi-giftenverklaring-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">ANBI-giftenverklaring</Link> per donateur.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Veilig en betrouwbaar
        </h2>
        <p className="text-[#261b07]/80 mb-6 leading-relaxed">
          Betalingen via Bunyan worden verwerkt door Stripe, een PCI DSS Level 1 gecertificeerde betaalverwerker die ook door bedrijven als Booking.com en KLM wordt gebruikt. Bunyan slaat nooit bankgegevens op. Alle persoonsgegevens worden opgeslagen in de EU, conform de AVG.
        </p>

        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Ook terugkerend doneren
        </h2>
        <p className="text-[#261b07]/80 mb-8 leading-relaxed">
          Naast eenmalige donaties ondersteunt Bunyan ook <Link href="/periodieke-giften-moskee" className="text-[#261b07] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">periodieke giften</Link> via automatische incasso. Donateurs stellen zelf een maandelijks bedrag in en Bunyan int dit automatisch. Zo bouwt uw moskee aan een stabiele, voorspelbare inkomstenstroom.
        </p>

        {/* CTA */}
        <div className="rounded-2xl bg-[#261b07] p-8 text-center">
          <h2 className="text-xl font-semibold text-[#f8f7f5] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            Start vandaag met online donaties
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
