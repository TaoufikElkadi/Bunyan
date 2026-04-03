"use client"

import { useState } from "react"

const faqs = [
  {
    question: "Wat is moskee software en waarom heb ik het nodig?",
    answer:
      "Moskee software is een digitaal platform waarmee moskeeën hun dagelijkse administratie efficiënt beheren — van donaties ontvangen tot ledenadministratie bijhouden. Veel moskeeën werken nog met contante collectes, Excel-bestanden en handmatige bonnetjes. Dat kost uren per week en is foutgevoelig. Met software zoals Bunyan automatiseert u dit: donaties komen direct binnen via iDEAL, donorprofielen worden automatisch aangemaakt, en aan het einde van het jaar genereert u met één klik ANBI-giftenverklaringen voor al uw donateurs.",
  },
  {
    question: "Hoe werkt online doneren via iDEAL voor moskeeën?",
    answer:
      "Elke moskee krijgt een eigen donatiepagina op bunyan.nl/doneren/uw-moskee. Donateurs kiezen een bedrag, selecteren eventueel een fonds (zoals bouwfonds of Ramadan-actie), en betalen direct via iDEAL — de meest gebruikte betaalmethode in Nederland. Het geld wordt rechtstreeks op uw rekening gestort via Stripe. Donateurs hoeven geen account aan te maken, en een donatie is binnen 30 seconden afgerond. U kunt de link delen via uw website, WhatsApp, sociale media of een QR-code in de moskee.",
  },
  {
    question: "Wat is een ANBI-giftenverklaring en wie heeft er recht op?",
    answer:
      "Een ANBI-giftenverklaring is een officieel document waarmee donateurs hun giften kunnen aftrekken van de belasting. Als uw moskee een ANBI-status heeft (Algemeen Nut Beogende Instelling), mogen donateurs hun giften opgeven bij de Belastingdienst. Bunyan genereert deze verklaringen automatisch per donateur over het gekozen jaar, compleet met alle verplichte velden zoals RSIN, KvK-nummer en donatieoverzicht. U hoeft alleen uw ANBI-gegevens eenmalig in te voeren.",
  },
  {
    question: "Is Bunyan gratis te gebruiken?",
    answer:
      "Ja, Bunyan heeft een gratis plan waarmee u direct kunt starten. U ontvangt onbeperkt donaties via iDEAL, bouwt automatisch donorprofielen op en deelt uw eigen donatiepagina via een QR-code. Er zijn geen transactiekosten bovenop de standaard Stripe-kosten. Voor uitgebreidere functies zoals ANBI-jaaropgaven, meerdere fondsen en e-mailnotificaties kunt u upgraden naar het Starter-plan (€49/maand).",
  },
  {
    question: "Hoe veilig zijn de gegevens van onze donateurs?",
    answer:
      "Zeer veilig. Alle gegevens worden opgeslagen in de EU en beschermd conform de AVG (Algemene Verordening Gegevensbescherming). Betalingen verlopen via Stripe, een PCI DSS Level 1 gecertificeerde betaalverwerker — dezelfde standaard die banken gebruiken. Bunyan slaat nooit creditcardgegevens of bankrekeningen op. Elke moskee heeft zijn eigen afgeschermde omgeving: bestuurders van moskee A kunnen nooit bij de gegevens van moskee B.",
  },
  {
    question: "Kan ik Bunyan gebruiken voor periodieke giften en contributies?",
    answer:
      "Ja. Donateurs kunnen via uw donatiepagina een maandelijkse periodieke gift instellen via automatische incasso (SEPA). Ze beheren hun eigen abonnement en kunnen het op elk moment pauzeren of stopzetten. Periodieke giften zijn extra interessant voor donateurs met belastingaftrek: bij een overeenkomst van minimaal 5 jaar zijn periodieke giften volledig aftrekbaar, zonder drempelbedrag. Bunyan houdt automatisch bij welke donateurs in aanmerking komen.",
  },
  {
    question: "Hoe snel kan ik starten met Bunyan?",
    answer:
      "Binnen 5 minuten. U maakt een gratis account aan, vult de basisgegevens van uw moskee in (naam, adres, IBAN), en uw donatiepagina is direct live. Vervolgens koppelt u Stripe om betalingen te ontvangen — dit duurt nog eens 10 minuten. Daarna kunt u uw donatiepaginalink delen en de eerste donatie ontvangen.",
  },
  {
    question: "Wat is het verschil tussen Bunyan en andere moskee-apps?",
    answer:
      "De meeste moskee-apps richten zich op gebedstijden, livestreams en communicatie. Bunyan focust specifiek op het financiële hart van uw moskee: donaties ontvangen, administreren en verantwoorden. Denk aan online doneren via iDEAL, automatische ANBI-giftenverklaringen, fondsbeheer en donorprofielen. Bunyan is gebouwd voor de Nederlandse markt, met iDEAL als primaire betaalmethode en ANBI-compliance volgens de eisen van de Belastingdienst.",
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="faq" className="py-28 sm:py-40 bg-[#f8f7f5]">
      <div className="mx-auto max-w-[1040px] px-6 sm:px-[30px]">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* Left — title */}
          <div className="lg:w-[280px] flex-shrink-0 lg:sticky lg:top-28 lg:self-start">
            <h2
              className="text-[32px] sm:text-[40px] font-[584] leading-[1.1] tracking-[-0.8px] text-[#261b07] mb-4"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Veelgestelde vragen
            </h2>
            <p className="text-[15px] leading-[1.6] text-[#261b07]/50">
              Alles wat u wilt weten over moskee software, online doneren en ANBI-giftenverklaringen.
            </p>
          </div>

          {/* Right — accordion */}
          <div className="flex-1 flex flex-col gap-2.5">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i
              return (
                <div
                  key={i}
                  className="rounded-[10px] bg-[#f0ede6] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
                  >
                    <span className="text-[15px] font-medium text-[#261b07] leading-snug">
                      {faq.question}
                    </span>
                    <span
                      className={`flex-shrink-0 w-9 h-9 rounded-[8px] flex items-center justify-center transition-colors ${
                        isOpen
                          ? "bg-[#261b07] text-[#f8f7f5]"
                          : "bg-[#e3dfd5] text-[#261b07]/50"
                      }`}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 6l4 4 4-4" />
                      </svg>
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-[14px] leading-[1.7] text-[#261b07]/65">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* FAQPage JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />
    </section>
  )
}
