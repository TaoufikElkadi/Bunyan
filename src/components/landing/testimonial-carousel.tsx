"use client"

const testimonials = [
  {
    quote: "Bunyan heeft ons donatiebeheer compleet getransformeerd. Wat vroeger uren kostte, is nu een kwestie van minuten.",
    name: "Ibrahim El-Amrani",
    role: "Penningmeester, Moskee An-Nour",
  },
  {
    quote: "De ANBI-rapportage bespaart ons weken werk per jaar. Eindelijk een tool die begrijpt wat moskeeën nodig hebben.",
    name: "Fatima Benhaddou",
    role: "Bestuurslid, Moskee Al-Fatiha",
  },
  {
    quote: "Onze donateurs vinden het geweldig. QR-code scannen, bedrag kiezen, klaar. Zo simpel moet het zijn.",
    name: "Mohammed Yilmaz",
    role: "Voorzitter, Ayasofya Moskee",
  },
  {
    quote: "Sinds we Bunyan gebruiken is ons maandelijks terugkerend inkomen met 40% gestegen. De tool verkoopt zichzelf.",
    name: "Ahmed Benali",
    role: "Penningmeester, Moskee Essalam",
  },
  {
    quote: "Het dashboard geeft ons bestuur precies het overzicht dat we nodig hebben. Transparant en professioneel.",
    name: "Sara Hamdaoui",
    role: "Secretaris, Moskee Al-Ihsan",
  },
  {
    quote: "Setup was in een kwartier klaar. Geen technische kennis nodig. Dezelfde dag nog onze eerste online donatie ontvangen.",
    name: "Yusuf Çelik",
    role: "Beheerder, Sultan Ahmet Moskee",
  },
  {
    quote: "De fondsenstructuur is perfect — we kunnen precies zien hoeveel er per doel binnenkomt. Bouwfonds, onderwijs, alles gescheiden.",
    name: "Khadija Amrani",
    role: "Penningmeester, Moskee Al-Waqf",
  },
  {
    quote: "Wat mij overtuigde: de Stripe-integratie werkt foutloos en de ANBI-opgaven zijn altijd correct. Dat is waar het om draait.",
    name: "Omar Hadj",
    role: "Financieel adviseur, IGN",
  },
]

export function TestimonialCarousel() {
  // Duplicate for seamless infinite scroll
  const items = [...testimonials, ...testimonials]

  return (
    <div className="relative">
      {/* Fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 z-10 bg-gradient-to-r from-[#f8f7f5] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 z-10 bg-gradient-to-l from-[#f8f7f5] to-transparent" />

      {/* Scrolling track */}
      <div className="flex gap-5 animate-scroll-left">
        {items.map((t, i) => (
          <div
            key={`${t.name}-${i}`}
            className="shrink-0 w-[340px] sm:w-[400px] rounded-t-[8px] rounded-br-[8px] rounded-bl-[8px] border-[0.666667px] border-[#e3dfd5] bg-white p-6 sm:p-8"
          >
            <p className="text-[14px] sm:text-[16px] leading-[1.5] text-[#261b07] mb-6">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div>
              <div className="text-[14px] font-[584] text-[#261b07]">{t.name}</div>
              <div className="text-[12px] text-[color:rgba(38,27,7,0.5)]">{t.role}</div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll-left {
          animation: scroll-left 60s linear infinite;
        }
        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
