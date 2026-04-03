import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Privacyverklaring — Bunyan",
  description:
    "Privacyverklaring van Bunyan. Hoe wij omgaan met persoonsgegevens van moskeeën en donateurs.",
  alternates: {
    canonical: "https://bunyan.nl/privacy",
  },
}

export default function PrivacyPage() {
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
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Privacyverklaring
        </h1>
        <p className="text-[13px] text-[#8a8478] mb-10">Laatst bijgewerkt: 3 april 2026</p>

        <div className="space-y-8 text-[#261b07]/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              1. Wie zijn wij?
            </h2>
            <p>
              Bunyan (&ldquo;wij&rdquo;, &ldquo;ons&rdquo;) is een platform voor donatiebeheer voor moskeeën in Nederland, bereikbaar via{" "}
              <Link href="https://bunyan.nl" className="underline underline-offset-2 hover:opacity-70">bunyan.nl</Link>.
              Wij treden op als verwerker namens de moskee (de verwerkingsverantwoordelijke) voor donateursgegevens, en als verwerkingsverantwoordelijke voor gegevens van moskee-beheerders.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              2. Welke gegevens verwerken wij?
            </h2>
            <p className="mb-3"><strong>Moskee-beheerders:</strong></p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Naam, e-mailadres en wachtwoord (accountgegevens)</li>
              <li>Naam, adres en KvK-/RSIN-nummer van de moskee</li>
              <li>Stripe-accountgegevens voor betalingsverwerking</li>
            </ul>
            <p className="mb-3"><strong>Donateurs:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Naam en e-mailadres (indien opgegeven bij donatie)</li>
              <li>Donatiebedrag, betaalmethode en transactie-ID</li>
              <li>Adresgegevens (alleen bij periodieke giftenovereenkomst voor ANBI)</li>
              <li>IP-adres (tijdelijk, voor fraudepreventie en rate limiting)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              3. Waarvoor gebruiken wij uw gegevens?
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Het verwerken en registreren van donaties</li>
              <li>Het versturen van donatiebevestigingen en ANBI-giftenverklaringen</li>
              <li>Het beheren van uw account en moskee-instellingen</li>
              <li>Het voorkomen van fraude en misbruik (rate limiting, IP-logging)</li>
              <li>Het verbeteren van onze dienstverlening (geanonimiseerde analytics)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              4. Rechtsgrondslag
            </h2>
            <p>Wij verwerken persoonsgegevens op basis van:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Uitvoering van een overeenkomst</strong> — voor het verwerken van donaties en het leveren van onze dienst aan moskeeën</li>
              <li><strong>Gerechtvaardigd belang</strong> — voor fraudepreventie en platformbeveiliging</li>
              <li><strong>Wettelijke verplichting</strong> — voor fiscale administratie (ANBI-giftenverklaringen)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              5. Derde partijen
            </h2>
            <p className="mb-3">Wij delen gegevens met de volgende partijen, uitsluitend voor de genoemde doeleinden:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Stripe</strong> (betalingsverwerking) — PCI-DSS gecertificeerd, gevestigd in de EU</li>
              <li><strong>Supabase</strong> (database en authenticatie) — gegevens opgeslagen in EU-regio (Frankfurt)</li>
              <li><strong>Vercel</strong> (hosting) — servers in EU-regio (Amsterdam)</li>
              <li><strong>Resend</strong> (e-mailverzending) — voor transactionele e-mails</li>
              <li><strong>Sentry</strong> (foutmonitoring) — geanonimiseerde foutrapportages</li>
            </ul>
            <p className="mt-3">Wij verkopen nooit persoonsgegevens aan derden.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              6. Bewaartermijnen
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Accountgegevens: tot het account wordt verwijderd</li>
              <li>Donatiegegevens: 7 jaar na het boekjaar (wettelijke bewaarplicht)</li>
              <li>IP-adressen voor rate limiting: maximaal 24 uur</li>
              <li>ANBI-giftenverklaringen: 7 jaar (fiscale bewaarplicht)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              7. Uw rechten
            </h2>
            <p className="mb-3">Op grond van de AVG heeft u het recht op:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Inzage</strong> — opvragen welke gegevens wij van u verwerken</li>
              <li><strong>Rectificatie</strong> — onjuiste gegevens laten corrigeren</li>
              <li><strong>Verwijdering</strong> — uw gegevens laten verwijderen (behoudens wettelijke bewaarplicht)</li>
              <li><strong>Overdraagbaarheid</strong> — uw gegevens in een gangbaar formaat ontvangen</li>
              <li><strong>Bezwaar</strong> — bezwaar maken tegen verwerking op basis van gerechtvaardigd belang</li>
            </ul>
            <p className="mt-3">
              Voor het uitoefenen van uw rechten kunt u contact opnemen via{" "}
              <a href="mailto:privacy@bunyan.nl" className="underline underline-offset-2 hover:opacity-70">privacy@bunyan.nl</a>.
              Wij reageren binnen 30 dagen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              8. Beveiliging
            </h2>
            <p>
              Wij nemen passende technische en organisatorische maatregelen om persoonsgegevens te beschermen,
              waaronder versleutelde verbindingen (TLS), row-level security op databaseniveau,
              en strikte toegangscontrole voor medewerkers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              9. Cookies
            </h2>
            <p>
              Wij gebruiken uitsluitend functionele cookies die noodzakelijk zijn voor het functioneren
              van de dienst (authenticatie, sessie). Wij gebruiken geen tracking-cookies of cookies van derden
              voor advertentiedoeleinden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              10. Klachten
            </h2>
            <p>
              Heeft u een klacht over de verwerking van uw persoonsgegevens? Neem dan contact met ons op via{" "}
              <a href="mailto:privacy@bunyan.nl" className="underline underline-offset-2 hover:opacity-70">privacy@bunyan.nl</a>.
              U heeft ook het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens (
              <a href="https://autoriteitpersoonsgegevens.nl" className="underline underline-offset-2 hover:opacity-70" target="_blank" rel="noopener noreferrer">autoriteitpersoonsgegevens.nl</a>).
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#e3dfd5] py-8 text-center">
        <p className="text-[13px] text-[#8a8478]">
          &copy; {new Date().getFullYear()} Bunyan &mdash;{" "}
          <Link href="/voorwaarden" className="underline underline-offset-2 hover:opacity-70">Algemene voorwaarden</Link>
        </p>
      </footer>
    </div>
  )
}
