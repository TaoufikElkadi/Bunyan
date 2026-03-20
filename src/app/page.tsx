import Image from "next/image"
import Link from "next/link"
import { InviteHandler } from "@/components/auth/invite-handler"
import { DashboardMockup } from "@/components/landing/dashboard-mockup"
import { FeatureScroll } from "@/components/landing/feature-scroll"
import { MobileHeroMockup } from "@/components/landing/mobile-hero-mockup"

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const navLinks = [
  { label: "Product", href: "#product", hasDropdown: false },
  { label: "Prijzen", href: "#prijzen", hasDropdown: false },
]



/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8f7f5] text-[#261b07]" style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
      <InviteHandler />

      {/* ---- Mobile: flat sticky top bar ---- */}
      <header className="lg:hidden sticky top-0 z-[999] flex items-center justify-between px-5 py-3 bg-[#f8f7f5]/95 backdrop-blur-md border-b border-[#e3dfd5]/60">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logos/logo_transparent.svg" alt="" width={24} height={24} className="h-6 w-6" />
          <span
            className="text-[16px] font-[584] tracking-[-0.36px] text-[#261b07] uppercase"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            bunyan
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-[#e3dfd5] bg-white px-4 py-2 text-[13px] font-medium text-[#261b07] hover:bg-[#f3f1ec] transition-colors"
          >
            Inloggen
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-[#261b07] px-4 py-2 text-[13px] font-semibold text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors"
          >
            Starten
          </Link>
        </div>
      </header>

      {/* ---- Desktop: floating pill navbar ---- */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 z-[999] justify-center px-4 pt-4">
        <nav className="flex items-center gap-1 bg-[#261b07] rounded-full px-2 py-1.5 shadow-[0_4px_24px_rgba(38,27,7,0.25)]">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 pl-3 pr-5"
          >
            <Image src="/logos/logo_transparent.svg" alt="" width={22} height={22} className="h-[22px] w-[22px]" />
            <span
              className="text-[16px] font-[584] tracking-[-0.36px] text-[#f8f7f5] uppercase"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              bunyan
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-0.5">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center gap-1 px-4 py-2 rounded-full text-[14px] font-medium text-[#f8f7f5]/70 hover:text-[#f8f7f5] hover:bg-white/10 transition-all"
              >
                {link.label}
                {link.hasDropdown && (
                  <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                )}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1 pl-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-full text-[14px] font-medium text-[#f8f7f5]/70 hover:text-[#f8f7f5] hover:bg-white/10 transition-all"
            >
              Inloggen
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-[#f9a600] px-5 py-2 text-[14px] font-semibold text-[#261b07] hover:bg-[#fbb320] transition-colors"
            >
              Gratis starten
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex flex-col">

        {/* ============================================================ */}
        {/*  HERO with gradient background                               */}
        {/* ============================================================ */}
        <div className="relative">
          {/* Gradient background — olive/sage to cream */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#c5bfa0]/30 via-[#d5cfb8]/20 to-[#f8f7f5] pointer-events-none" />

          <section className="relative pt-10 lg:pt-28 pb-10">
            <div className="mx-auto max-w-[980px] px-[30px] text-center">
              {/* Category */}
              <p className="text-[12px] font-medium tracking-[0.6px] uppercase text-[color:rgba(38,27,7,0.5)] mb-5">
                Gemeenschapsbeheer voor moskeeën
              </p>

              {/* Headline */}
              <h1
                className="text-[42px] sm:text-[56px] md:text-[64.8px] lg:text-[72px] font-[584] leading-[1.125] tracking-[-1.44px] text-[#261b07] mb-6"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                Ken uw gemeenschap, maximaliseer elke gift
              </h1>

              {/* Subtitle */}
              <p className="mx-auto max-w-[534px] text-[16px] sm:text-[18px] leading-[1.5] text-[color:rgba(38,27,7,0.72)] mb-10">
                Van donaties en belastingvoordeel tot ledeninzicht — het platform waarmee moskeeën hun gemeenschap écht leren kennen.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-t-[8px] rounded-br-[8px] rounded-bl-[8px] bg-[#261b07] px-[30px] py-[9.6px] text-[16px] font-medium text-[#f8f7f5] hover:scale-[1.0125] hover:-translate-y-px transition-all shadow-[inset_0_2px_4px_rgba(255,255,255,0.56),0_4px_8px_rgba(38,27,7,0.06),0_1px_2px_rgba(38,27,7,0.36)] w-full sm:w-auto"
                >
                  Gratis starten
                </Link>
                <a
                  href="#product"
                  className="inline-flex items-center justify-center rounded-t-[8px] rounded-br-[8px] rounded-bl-[8px] border-[0.666667px] border-[#e3dfd5] px-[30px] py-[9.6px] text-[16px] font-medium text-[#261b07] hover:bg-[rgba(38,27,7,0.08)] transition-all w-full sm:w-auto"
                >
                  <svg className="w-4 h-4 mr-2.5" viewBox="0 0 16 16" fill="currentColor"><path d="M6 3.5L12 8 6 12.5V3.5z"/></svg>
                  Bekijk demo
                </a>
              </div>
            </div>
          </section>

          {/* ---- Dashboard mockup — overlapping into hero gradient ---- */}
          <section id="product" className="relative pb-0">
            {/* Desktop: edge-to-edge with open bottom */}
            <div className="hidden md:block mx-auto max-w-[1216px] px-4 sm:px-6">
              <div className="relative rounded-t-[12px] border-[0.666667px] border-b-0 border-[#e3dfd5] overflow-hidden shadow-[0_-4px_60px_-12px_rgba(38,27,7,0.08)]">
                <DashboardMockup />
              </div>
            </div>

            {/* Mobile: zoomed-out full dashboard view in a warm frame */}
            <div className="md:hidden mx-auto px-4">
              <MobileHeroMockup />
            </div>
          </section>
        </div>

        {/* ============================================================ */}
        {/*  Feature scroll — sticky mockup + scrolling features          */}
        {/* ============================================================ */}
        <FeatureScroll />

        {/* ============================================================ */}
        {/*  PRICING — Maze-inspired layout                              */}
        {/* ============================================================ */}
        <section id="prijzen" className="relative py-28 sm:py-40 bg-[#eceae5]">
          <div className="mx-auto max-w-[1040px] px-6 sm:px-[30px]">

            {/* Section header */}
            <div className="text-center mb-16">
              <h2
                className="text-[48px] sm:text-[64px] font-[380] leading-[1.08] tracking-[-1.5px] text-[#1a1510] mb-5"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                Prijzen &amp; Pakketten
              </h2>
              <p className="mx-auto max-w-[380px] text-[15px] leading-[1.65] text-[color:rgba(26,21,16,0.5)]">
                Bunyan geeft moskeeën zicht op hun gemeenschap — wie doneert, wie afhaakt, en waar belastingvoordeel op tafel blijft liggen.
              </p>
            </div>

            {/* Main pricing grid */}
            <div className="grid lg:grid-cols-2 gap-3 items-start">

              {/* ── Left column: Free + Starter stacked ── */}
              <div className="flex flex-col gap-3">

                {/* FREE card */}
                <div className="bg-white rounded-[14px] border border-[#dddad3] overflow-hidden">
                  <div className="flex min-h-[280px]">
                    {/* Plan info */}
                    <div className="flex-1 p-7 flex flex-col">
                      <span className="self-start text-[10px] font-semibold tracking-[0.55px] uppercase bg-[#edeae4] text-[color:rgba(26,21,16,0.5)] rounded-[6px] px-3 py-1.5 mb-7">
                        Gratis
                      </span>
                      <h3
                        className="text-[40px] font-[380] leading-none tracking-[-1px] text-[#1a1510] mb-3"
                        style={{ fontFamily: "var(--font-display), sans-serif" }}
                      >
                        Gratis
                      </h3>
                      <p className="text-[13px] leading-[1.55] text-[color:rgba(26,21,16,0.5)] flex-1 mb-7">
                        Voor moskeeën die hun gemeenschap willen leren kennen — begin gratis met donaties en ledeninzicht.
                      </p>
                      <Link
                        href="/signup"
                        className="self-start inline-flex items-center justify-center rounded-[8px] bg-[#1a1510] px-5 py-[9px] text-[13px] font-semibold text-white hover:bg-[#2c2018] transition-colors"
                      >
                        Gratis starten
                      </Link>
                    </div>
                    {/* Vertical divider */}
                    <div className="w-px bg-[#dddad3] flex-shrink-0" />
                    {/* Features */}
                    <div className="flex-1 p-7">
                      <div className="flex items-center gap-2 text-[13px] text-[color:rgba(26,21,16,0.55)] mb-2">
                        <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                          <rect x="2" y="3" width="12" height="10" rx="1.5"/>
                          <path d="M5 6.5h6M5 9h4" strokeLinecap="round"/>
                        </svg>
                        Onbeperkte donaties
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-[color:rgba(26,21,16,0.55)] mb-6">
                        <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                          <circle cx="8" cy="5.5" r="2.5"/>
                          <path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" strokeLinecap="round"/>
                        </svg>
                        1 beheerder
                      </div>
                      <p className="text-[10px] font-semibold tracking-[0.55px] uppercase text-[color:rgba(26,21,16,0.35)] mb-3">
                        Gratis inclusief:
                      </p>
                      <ul className="space-y-2.5">
                        {["iDEAL betalingen", "Donorprofielen", "QR-donatiepagina"].map((f) => (
                          <li key={f} className="flex items-center gap-2.5 text-[13px] text-[#1a1510]">
                            <svg className="w-[15px] h-[15px] flex-shrink-0 text-[color:rgba(26,21,16,0.35)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                              <circle cx="8" cy="8" r="6.5"/>
                              <path d="M5.5 8.25l1.75 1.75L10.75 6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* STARTER card */}
                <div className="bg-white rounded-[14px] border border-[#dddad3] overflow-hidden">
                  <div className="flex min-h-[280px]">
                    {/* Plan info */}
                    <div className="flex-1 p-7 flex flex-col">
                      <span className="self-start text-[10px] font-semibold tracking-[0.55px] uppercase bg-[#edeae4] text-[color:rgba(26,21,16,0.5)] rounded-[6px] px-3 py-1.5 mb-7">
                        €49 per maand
                      </span>
                      <h3
                        className="text-[40px] font-[380] leading-none tracking-[-1px] text-[#1a1510] mb-3"
                        style={{ fontFamily: "var(--font-display), sans-serif" }}
                      >
                        Starter
                      </h3>
                      <p className="text-[13px] leading-[1.55] text-[color:rgba(26,21,16,0.5)] flex-1 mb-7">
                        Voor moskeeën die belastingvoordeel willen activeren en zicht willen houden op hun leden.
                      </p>
                      <Link
                        href="/signup"
                        className="self-start inline-flex items-center justify-center rounded-[8px] bg-[#1a1510] px-5 py-[9px] text-[13px] font-semibold text-white hover:bg-[#2c2018] transition-colors"
                      >
                        Nu aanmelden
                      </Link>
                    </div>
                    {/* Vertical divider */}
                    <div className="w-px bg-[#dddad3] flex-shrink-0" />
                    {/* Features */}
                    <div className="flex-1 p-7">
                      <div className="flex items-center gap-2 text-[13px] text-[color:rgba(26,21,16,0.55)] mb-2">
                        <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                          <rect x="2" y="3" width="12" height="10" rx="1.5"/>
                          <path d="M5 6.5h6M5 9h4" strokeLinecap="round"/>
                        </svg>
                        Onbeperkte donaties
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-[color:rgba(26,21,16,0.55)] mb-6">
                        <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                          <circle cx="8" cy="5.5" r="2.5"/>
                          <path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" strokeLinecap="round"/>
                        </svg>
                        5 beheerders
                      </div>
                      <p className="text-[10px] font-semibold tracking-[0.55px] uppercase text-[color:rgba(26,21,16,0.35)] mb-3">
                        Alles in gratis, en:
                      </p>
                      <ul className="space-y-2.5">
                        {["ANBI-jaaropgaven", "Meerdere fondsen", "Excel & PDF export", "E-mailnotificaties"].map((f) => (
                          <li key={f} className="flex items-center gap-2.5 text-[13px] text-[#1a1510]">
                            <svg className="w-[15px] h-[15px] flex-shrink-0 text-[color:rgba(26,21,16,0.35)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                              <circle cx="8" cy="8" r="6.5"/>
                              <path d="M5.5 8.25l1.75 1.75L10.75 6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

              </div>

              {/* ── Right column: Enterprise — tall card ── */}
              <div className="bg-white rounded-[14px] border border-[#dddad3] overflow-hidden flex flex-col">

                {/* Top: plan info + lime image */}
                <div className="p-7 flex gap-4 items-start">
                  <div className="flex-1 flex flex-col">
                    <span className="self-start text-[10px] font-semibold tracking-[0.55px] uppercase bg-[#edeae4] text-[color:rgba(26,21,16,0.5)] rounded-[6px] px-3 py-1.5 mb-7">
                      Maatwerk prijs
                    </span>
                    <h3
                      className="text-[40px] font-[380] leading-none tracking-[-1px] text-[#1a1510] mb-3"
                      style={{ fontFamily: "var(--font-display), sans-serif" }}
                    >
                      Enterprise
                    </h3>
                    <p className="text-[13px] leading-[1.55] text-[color:rgba(26,21,16,0.5)] mb-7">
                      Voor koepelorganisaties die gemeenschapsinzicht over meerdere moskeeën willen bundelen.
                    </p>
                    <a
                      href="mailto:info@bunyan.nl"
                      className="self-start inline-flex items-center justify-center rounded-[8px] bg-[#1a1510] px-5 py-[9px] text-[13px] font-semibold text-white hover:bg-[#2c2018] transition-colors"
                    >
                      Contact opnemen
                    </a>
                  </div>
                  {/* Lime decorative block */}
                  <div
                    className="w-[150px] h-[175px] rounded-[8px] flex-shrink-0 overflow-hidden relative"
                    style={{ background: "#c6e535" }}
                  >
                    <svg viewBox="0 0 150 175" className="absolute inset-0 w-full h-full" fill="none">
                      {/* Halftone globe pattern */}
                      <circle cx="75" cy="88" r="55" fill="#b0d020" />
                      <circle cx="75" cy="88" r="44" fill="#c6e535" />
                      {/* Dot grid clipped to globe */}
                      <clipPath id="globe-clip"><circle cx="75" cy="88" r="44"/></clipPath>
                      <g clipPath="url(#globe-clip)" fill="#8fac00" opacity="0.6">
                        {[0,1,2,3,4,5,6,7,8].map((col) =>
                          [0,1,2,3,4,5,6,7,8,9].map((row) => (
                            <circle key={`${col}-${row}`} cx={27 + col * 12} cy={44 + row * 10} r={1.6} />
                          ))
                        )}
                      </g>
                      {/* Latitude arcs */}
                      <g stroke="#8fac00" strokeWidth="0.8" fill="none" opacity="0.5">
                        <ellipse cx="75" cy="88" rx="44" ry="14"/>
                        <ellipse cx="75" cy="88" rx="44" ry="28"/>
                        <ellipse cx="75" cy="88" rx="44" ry="42"/>
                        <line x1="75" y1="44" x2="75" y2="132"/>
                        <line x1="31" y1="88" x2="119" y2="88"/>
                      </g>
                      <circle cx="75" cy="88" r="44" fill="none" stroke="#8fac00" strokeWidth="0.8" opacity="0.5"/>
                    </svg>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-[#dddad3]" />

                {/* Bottom: features */}
                <div className="p-7 flex-1">
                  <div className="flex items-center gap-2 text-[13px] text-[color:rgba(26,21,16,0.55)] mb-2">
                    <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <rect x="2" y="3" width="12" height="10" rx="1.5"/>
                      <path d="M5 6.5h6M5 9h4" strokeLinecap="round"/>
                    </svg>
                    Onbeperkte donaties
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-[color:rgba(26,21,16,0.55)] mb-6">
                    <svg className="w-[15px] h-[15px] flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <circle cx="8" cy="5.5" r="2.5"/>
                      <path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" strokeLinecap="round"/>
                    </svg>
                    Onbeperkte beheerders
                  </div>
                  <p className="text-[10px] font-semibold tracking-[0.55px] uppercase text-[color:rgba(26,21,16,0.35)] mb-3">
                    Enterprise inclusief:
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      "Toegang tot alle functies van Starter",
                      "Multi-moskee dashboard",
                      "Aangepaste ANBI-rapporten",
                      "Terugkerende giften via SEPA",
                      "Campagnebeheer",
                      "QR-scan analyse",
                      "Excel & PDF export",
                      "Alle Bunyan AI-functies",
                      "Geautomatiseerde financiële rapporten",
                      "Enterprise beveiliging & AVG-audit",
                      "Prioriteit support & accountmanager",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-[13px] text-[#1a1510]">
                        <svg className="w-[15px] h-[15px] flex-shrink-0 text-[color:rgba(26,21,16,0.35)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                          <circle cx="8" cy="8" r="6.5"/>
                          <path d="M5.5 8.25l1.75 1.75L10.75 6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>

            {/* View all features */}
            <div className="text-center mt-10">
              <button className="inline-flex items-center justify-center rounded-full border border-[#c8c5be] bg-transparent px-7 py-2.5 text-[14px] text-[#1a1510] hover:bg-white/70 transition-colors">
                Alle functies bekijken
              </button>
            </div>

          </div>
        </section>
      </main>

      {/* ============================================================ */}
      {/*  FOOTER                                                       */}
      {/* ============================================================ */}
      <footer className="bg-[#f8f7f5]">

        {/* ── Top link columns ── */}
        <div className="mx-auto max-w-[1216px] px-[30px] pt-16 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

            {/* Col 1: Bedrijf */}
            <div>
              <span className="inline-block text-[10px] font-semibold tracking-[0.55px] uppercase bg-[#edeae4] text-[color:rgba(26,21,16,0.45)] rounded-[5px] px-2.5 py-1 mb-5">
                Bedrijf
              </span>
              <ul className="space-y-3">
                {[
                  { label: "Over ons", href: "#over-ons" },
                  { label: "Contact", href: "mailto:info@bunyan.nl" },
                  { label: "Prijzen", href: "#prijzen" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="text-[15px] text-[#1a1510] hover:opacity-50 transition-opacity">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 2: Platform */}
            <div>
              <span className="inline-block text-[10px] font-semibold tracking-[0.55px] uppercase bg-[#edeae4] text-[color:rgba(26,21,16,0.45)] rounded-[5px] px-2.5 py-1 mb-5">
                Platform
              </span>
              <ul className="space-y-3">
                {[
                  { label: "Gemeenschapsinzicht", href: "#product" },
                  { label: "Donatiebeheer", href: "#product" },
                  { label: "ANBI & belastingvoordeel", href: "#product" },
                  { label: "Ledenprofielen", href: "#product" },
                  { label: "Periodieke giften", href: "#product" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="text-[15px] text-[#1a1510] hover:opacity-50 transition-opacity">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Bronnen */}
            <div>
              <span className="inline-block text-[10px] font-semibold tracking-[0.55px] uppercase bg-[#edeae4] text-[color:rgba(26,21,16,0.45)] rounded-[5px] px-2.5 py-1 mb-5">
                Bronnen
              </span>
              <ul className="space-y-3">
                {[
                  { label: "Handleidingen", href: "#" },
                  { label: "Documentatie", href: "#" },
                  { label: "Veelgestelde vragen", href: "#" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="text-[15px] text-[#1a1510] hover:opacity-50 transition-opacity">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Follow us */}
            <div className="flex flex-col gap-3">
              <div className="rounded-[10px] bg-[#c6e535] px-4 py-3 flex items-center justify-between">
                <span className="text-[14px] font-medium text-[#2a3800]">Volg ons</span>
                <div className="flex items-center gap-2">
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-[6px] bg-[#2a3800]/10 hover:bg-[#2a3800]/20 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-[#2a3800]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-[6px] bg-[#2a3800]/10 hover:bg-[#2a3800]/20 flex items-center justify-center transition-colors">
                    <svg className="w-[15px] h-[15px] text-[#2a3800]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.735-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Giant brand name ── */}
        <div className="mx-auto max-w-[1216px] px-[20px] sm:px-[30px] overflow-hidden mt-4">
          <h2
            className="font-[380] leading-[0.88] tracking-[-0.03em] text-[#1a1510] select-none"
            style={{
              fontFamily: "var(--font-display), sans-serif",
              fontSize: "clamp(80px, 16vw, 210px)",
            }}
          >
            Bunyan
          </h2>
        </div>

        {/* ── Legal bar ── */}
        <div className="border-t border-[#e3dfd5] mt-6">
          <div className="mx-auto max-w-[1216px] px-[30px] py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-[11px] text-[color:rgba(26,21,16,0.38)]">
              Copyright &copy; 2026 Bunyan — Gemeenschapsbeheer voor moskeeën in Nederland
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              {[
                { label: "Privacybeleid", href: "/privacy" },
                { label: "Algemene voorwaarden", href: "/terms" },
                { label: "AVG-compliance", href: "#" },
                { label: "Beveiliging", href: "#" },
                { label: "Status", href: "#" },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-[10px] font-semibold tracking-[0.4px] uppercase text-[color:rgba(26,21,16,0.38)] hover:text-[#1a1510] transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

      </footer>
    </div>
  )
}
