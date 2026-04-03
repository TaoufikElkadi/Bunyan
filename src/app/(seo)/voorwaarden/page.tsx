import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Algemene voorwaarden — Bunyan",
  description:
    "Algemene voorwaarden van Bunyan, het donatieplatform voor moskeeën in Nederland.",
  alternates: {
    canonical: "https://bunyan.nl/voorwaarden",
  },
}

export default function VoorwaardenPage() {
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
          Algemene voorwaarden
        </h1>
        <p className="text-[13px] text-[#8a8478] mb-10">Laatst bijgewerkt: 3 april 2026</p>

        <div className="space-y-8 text-[#261b07]/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              1. Definities
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Platform</strong>: de website en applicatie van Bunyan, bereikbaar via bunyan.nl</li>
              <li><strong>Moskee</strong>: de organisatie die een account aanmaakt op het Platform om donaties te ontvangen</li>
              <li><strong>Beheerder</strong>: de persoon die namens de Moskee het Platform beheert</li>
              <li><strong>Donateur</strong>: de persoon die via het Platform een donatie doet</li>
              <li><strong>Dienst</strong>: de door Bunyan aangeboden software voor donatiebeheer</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              2. Toepasselijkheid
            </h2>
            <p>
              Deze voorwaarden zijn van toepassing op elk gebruik van het Platform door Moskeeën, Beheerders en Donateurs.
              Door gebruik te maken van het Platform gaat u akkoord met deze voorwaarden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              3. Dienstverlening
            </h2>
            <p className="mb-3">Bunyan biedt Moskeeën de mogelijkheid om:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Online donaties te ontvangen via iDEAL, creditcard en SEPA-incasso</li>
              <li>Donateurs en donaties te beheren via een dashboard</li>
              <li>ANBI-giftenverklaringen te genereren</li>
              <li>Periodieke giftenovereenkomsten digitaal af te sluiten</li>
            </ul>
            <p className="mt-3">
              Bunyan is geen betalingsdienstaanbieder. Betalingen worden verwerkt door Stripe,
              dat een directe relatie heeft met de Moskee via Stripe Connect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              4. Abonnementen en kosten
            </h2>
            <p className="mb-3">Bunyan biedt drie abonnementen:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Gratis</strong> — basisfunctionaliteit, geen maandelijkse kosten</li>
              <li><strong>Starter</strong> — uitgebreide functionaliteit, maandelijks tarief</li>
              <li><strong>Growth</strong> — volledige functionaliteit, maandelijks tarief</li>
            </ul>
            <p className="mt-3">
              Prijzen worden vermeld exclusief btw, tenzij anders aangegeven.
              Bunyan behoudt zich het recht voor prijzen te wijzigen met een kennisgevingstermijn van 30 dagen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              5. Verplichtingen van de Moskee
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>De Moskee garandeert dat zij rechtmatig bevoegd is om donaties te ontvangen</li>
              <li>De Moskee is verantwoordelijk voor de juistheid van de opgegeven gegevens (naam, RSIN, KvK-nummer)</li>
              <li>De Moskee is verwerkingsverantwoordelijke voor de persoonsgegevens van haar donateurs</li>
              <li>De Moskee gebruikt het Platform niet voor illegale doeleinden</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              6. Donaties en betalingen
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Donaties worden rechtstreeks van de Donateur naar de Moskee overgemaakt via Stripe</li>
              <li>Bunyan ontvangt of beheert geen donatiegelden</li>
              <li>Terugbetalingen worden afgehandeld tussen de Moskee en Stripe</li>
              <li>Transactiekosten van Stripe zijn voor rekening van de Moskee, tenzij doorberekend aan de Donateur (fee coverage)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              7. Beschikbaarheid
            </h2>
            <p>
              Bunyan streeft naar een beschikbaarheid van 99,5% op jaarbasis, maar garandeert geen ononderbroken
              beschikbaarheid. Gepland onderhoud wordt vooraf aangekondigd. Bunyan is niet aansprakelijk voor
              schade als gevolg van onbeschikbaarheid.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              8. Aansprakelijkheid
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Bunyan is niet aansprakelijk voor indirecte schade, gevolgschade of gederfde inkomsten</li>
              <li>De aansprakelijkheid van Bunyan is beperkt tot het bedrag dat de Moskee in de voorafgaande 12 maanden aan Bunyan heeft betaald</li>
              <li>Bunyan is niet aansprakelijk voor de juistheid van door de Moskee ingevoerde gegevens</li>
              <li>Bunyan is niet aansprakelijk voor de fiscale verplichtingen van de Moskee (waaronder ANBI-status)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              9. Beeindiging
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>De Moskee kan het abonnement op elk moment opzeggen via het dashboard</li>
              <li>Bij opzegging blijft het account actief tot het einde van de lopende factureringsperiode</li>
              <li>Bunyan kan het account opschorten of beeidigen bij schending van deze voorwaarden</li>
              <li>Na beeindiging worden gegevens bewaard conform de wettelijke bewaarplicht (7 jaar voor financiële gegevens)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              10. Privacy
            </h2>
            <p>
              Wij verwerken persoonsgegevens conform onze{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:opacity-70">privacyverklaring</Link>.
              De Moskee gaat een verwerkersovereenkomst aan met Bunyan voor de verwerking van donateursgegevens.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              11. Toepasselijk recht
            </h2>
            <p>
              Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de
              bevoegde rechter in het arrondissement waar Bunyan is gevestigd.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#261b07] mb-3" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              12. Contact
            </h2>
            <p>
              Voor vragen over deze voorwaarden kunt u contact opnemen via{" "}
              <a href="mailto:info@bunyan.nl" className="underline underline-offset-2 hover:opacity-70">info@bunyan.nl</a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#e3dfd5] py-8 text-center">
        <p className="text-[13px] text-[#8a8478]">
          &copy; {new Date().getFullYear()} Bunyan &mdash;{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:opacity-70">Privacyverklaring</Link>
        </p>
      </footer>
    </div>
  )
}
