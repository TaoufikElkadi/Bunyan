"use client"

import { useEffect, useRef, useState } from "react"
import { DonationFormMockup } from "./donation-form-mockup"
import { ChartsMockup } from "./charts-mockup"
import { AnbiMockup } from "./anbi-mockup"

const features = [
  {
    id: "donaties",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#261b07" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5.5" width="22" height="17" rx="2.5" />
        <line x1="3" y1="12.5" x2="25" y2="12.5" />
        <rect x="6" y="16" width="5" height="3" rx="0.75" fill="#261b07" stroke="none" opacity="0.2" />
      </svg>
    ),
    title: "Donaties zonder gedoe",
    desc: "Van iDEAL tot terugkerende giften — uw gemeenschap doneert moeiteloos via een persoonlijke donatiepagina.",
  },
  {
    id: "dashboard",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#261b07" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="13" width="5" height="11" rx="1" />
        <rect x="11.5" y="7" width="5" height="17" rx="1" />
        <rect x="20" y="4" width="5" height="20" rx="1" />
      </svg>
    ),
    title: "Inzicht in elke euro",
    desc: "Realtime dashboard met fondsen, trends en donoroverzichten. Weet precies waar uw geld naartoe gaat.",
  },
  {
    id: "anbi",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#261b07" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 3l2 2L11 3l2 2L15 3l2 2L19 3l2 2L23 3v22l-2-2-2 2-2-2-2 2-2-2-2 2-2-2-2 2V3z" />
        <line x1="10" y1="10" x2="18" y2="10" />
        <line x1="10" y1="14" x2="18" y2="14" />
        <line x1="10" y1="18" x2="15" y2="18" />
      </svg>
    ),
    title: "ANBI-rapportage in één klik",
    desc: "Genereer automatisch jaaropgaven voor de Belastingdienst. Compliant, correct, klaar.",
  },
]

const mockups = [DonationFormMockup, ChartsMockup, AnbiMockup]

export function FeatureScroll() {
  const [activeIndex, setActiveIndex] = useState(0)
  const featureRefs = useRef<(HTMLDivElement | null)[]>([])
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    featureRefs.current.forEach((el, i) => {
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(i)
          }
        },
        { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <section ref={sectionRef} className="relative border-t-[0.666667px] border-t-[#e3dfd5]">
      <div className="mx-auto max-w-[1216px] px-[30px]">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-20">
          {/* Left: heading + features */}
          <div className="py-20 lg:py-40">
            {/* Section heading */}
            <h2
              className="text-[36px] sm:text-[48px] md:text-[56px] font-[584] leading-[1.1] tracking-[-1.12px] text-[#261b07] mb-4"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Van complexiteit
              <br />
              naar overzicht
            </h2>
            <p className="text-[16px] leading-[1.5] text-[color:rgba(38,27,7,0.72)] mb-16 max-w-[420px]">
              Eén platform voor donaties, fondsbeheer, ANBI-rapportage en donorinzichten — gebouwd voor moskeeën.
            </p>

            {/* Feature list */}
            <div className="flex flex-col">
              {features.map((f, i) => (
                <div
                  key={f.id}
                  ref={(el) => { featureRefs.current[i] = el }}
                  className="py-10 first:pt-0"
                >
                  {i > 0 && (
                    <div className="absolute -mt-10 left-0 right-0 h-[0.666667px] bg-[#e3dfd5]" style={{ width: "100%" }} />
                  )}
                  <div
                    className={`transition-opacity duration-500 ${
                      activeIndex === i ? "opacity-100" : "lg:opacity-40"
                    }`}
                  >
                    <div className="mb-4">{f.icon}</div>
                    <h3
                      className="text-[20px] sm:text-[24px] font-[584] leading-tight tracking-[-0.36px] text-[#261b07] mb-3"
                      style={{ fontFamily: "var(--font-display), sans-serif" }}
                    >
                      {f.title}
                    </h3>
                    <p className="text-[14px] sm:text-[15px] leading-[1.6] text-[color:rgba(38,27,7,0.72)] max-w-[400px]">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: sticky mockup */}
          <div className="hidden lg:flex items-start py-40">
            <div className="sticky top-[120px] w-full">
              {/* Rectangle frame — warm background, screenshot offset inside */}
              <div
                className="relative w-full rounded-[20px] overflow-hidden bg-[#ddd9d0]"
                style={{ aspectRatio: "3/4" }}
              >
                {/* Screenshot: offset top-left, scaled up so it bleeds off right+bottom */}
                <div className="absolute top-7 left-7" style={{ width: "calc(100% - 28px)" }}>
                  <div className="relative" style={{ transform: "scale(1.25)", transformOrigin: "top left" }}>
                    {mockups.map((Mockup, i) => (
                      <div
                        key={i}
                        className={`transition-all duration-500 ease-in-out ${
                          activeIndex === i
                            ? "opacity-100 translate-y-0 relative"
                            : "opacity-0 translate-y-8 pointer-events-none absolute top-0 left-0 w-full"
                        }`}
                      >
                        <Mockup />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
