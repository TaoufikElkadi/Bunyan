/**
 * Dashboard mockup for the landing page hero.
 * Rich product screenshot style — inspired by Runway's Exec Dashboard.
 */
export function DashboardMockup() {
  return (
    <div className="relative">
      <div className="relative bg-white overflow-hidden">
        <div className="flex min-h-[400px] sm:min-h-[520px] lg:min-h-[620px]">
          {/* ---- Sidebar ---- */}
          <div className="hidden md:flex flex-col w-[200px] lg:w-[210px] border-r border-[#F0EBE3] bg-[#FAFAF8] shrink-0">
            {/* Sidebar header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#F0EBE3]">
              <div className="w-5 h-5 rounded bg-[#345e7d] flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3" fill="#b5934b"/></svg>
              </div>
              <span className="text-[12px] font-semibold text-[#1A1917]">Al-Fatiha Moskee</span>
              <ChevronIcon className="ml-auto" />
            </div>

            {/* Nav — compact like Runway's Sections sidebar */}
            <div className="px-2.5 py-3 flex-1 text-[12px]">
              <div className="text-[9px] font-semibold tracking-[0.08em] uppercase text-[#A09888] px-2.5 mb-1.5">Overzicht</div>
              <nav className="space-y-px mb-4">
                <SidebarItem label="Dashboard" active />
                <SidebarItem label="Donatie-analyse" />
              </nav>

              <div className="text-[9px] font-semibold tracking-[0.08em] uppercase text-[#A09888] px-2.5 mb-1.5">Beheer</div>
              <nav className="space-y-px mb-4">
                <SidebarItem label="Donaties" badge="24" />
                <SidebarItem label="Donoren" />
                <SidebarItem label="Fondsen" />
                <SidebarItem label="Campagnes" />
              </nav>

              <div className="text-[9px] font-semibold tracking-[0.08em] uppercase text-[#A09888] px-2.5 mb-1.5">Tools</div>
              <nav className="space-y-px mb-4">
                <SidebarItem label="QR-codes" />
                <SidebarItem label="ANBI-opgaven" />
              </nav>

              <div className="text-[9px] font-semibold tracking-[0.08em] uppercase text-[#A09888] px-2.5 mb-1.5">Instellingen</div>
              <nav className="space-y-px">
                <SidebarItem label="Organisatie" />
                <SidebarItem label="Team" />
                <SidebarItem label="Integraties" arrow />
              </nav>
            </div>
          </div>

          {/* ---- Main content ---- */}
          <div className="flex-1 bg-[#FEFEFE] min-w-0">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-[#F0EBE3]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#8A7D6B]">
                <span className="text-[13px]">🏠</span>
                <span>Overzicht</span>
                <span className="text-[#D0C9BC]">›</span>
                <span className="text-[#1A1917] font-medium">Dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 bg-[#F5F2ED] rounded-md px-2.5 py-1 w-[140px]">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="3.5" stroke="#8A7D6B" strokeWidth="1.2"/><line x1="7.5" y1="7.5" x2="10.5" y2="10.5" stroke="#8A7D6B" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  <span className="text-[10px] text-[#A09888]">Zoeken...</span>
                </div>
                <div className="hidden lg:flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-[#F5F2ED] flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="2.5" r="1.5" stroke="#8A7D6B" strokeWidth="1"/><path d="M2 8.5c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke="#8A7D6B" strokeWidth="1"/></svg>
                  </div>
                  <div className="w-5 h-5 rounded bg-[#F5F2ED] flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1v3M5 6v.5M2.5 4h5" stroke="#8A7D6B" strokeWidth="1" strokeLinecap="round"/></svg>
                  </div>
                </div>
                <span className="text-[10px] text-[#A09888] hidden lg:inline">Delen</span>
                <div className="w-6 h-6 rounded-full bg-[#C87D3A] flex items-center justify-center">
                  <span className="text-white text-[9px] font-bold">TM</span>
                </div>
              </div>
            </div>

            {/* Content area */}
            <div className="p-4 sm:p-5">
              {/* KPI row — 5 cards like Runway's ARR / Cash / ACV / Runway with area fill charts */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-5">
                <KpiCard label="Deze maand" value="€4.280" change="▲ €520" chartPath="M0 28 Q8 26 16 22 T32 20 T48 16 T64 14 T80 10 T96 7 T112 5 T120 4" />
                <KpiCard label="MRR" value="€1.850" change="▲ €148" chartPath="M0 24 Q12 22 24 20 T48 18 T72 14 T96 10 T120 6" />
                <KpiCard label="Gem. gift" value="€35" change="▲ €3" chartPath="M0 20 Q16 22 32 18 T64 16 T96 12 T120 8" />
                <KpiCard label="Nieuwe donoren" value="12" change="▲ 3" chartPath="M0 22 Q20 24 40 20 T80 14 T120 6" />
                <KpiCard label="Retentie" value="94%" change="▲ 2%" chartPath="M0 16 Q20 14 40 12 T80 8 T120 4" />
              </div>

              {/* Campaign timeline — like Runway's Growth Roadmap */}
              <div className="bg-white rounded-xl border border-[#F0EBE3] p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-semibold text-[#1A1917]">Campagne overzicht</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-[#e8f0d4] text-[#4a7c10] rounded px-2 py-0.5 font-medium flex items-center gap-1">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3" fill="#4a7c10"/></svg>
                      Actief
                    </span>
                    <span className="text-[10px] text-[#A09888] hidden lg:inline">Aanpassen</span>
                  </div>
                </div>
                {/* Timeline header */}
                <div className="flex items-center border-b border-[#F0EBE3] pb-2 mb-2.5">
                  <div className="w-[160px] lg:w-[180px] shrink-0 text-[10px] text-[#A09888] font-medium">Campagne</div>
                  <div className="flex-1 grid grid-cols-6 gap-0">
                    {["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun"].map(m => (
                      <span key={m} className="text-[9px] text-[#A09888] text-center">{m}</span>
                    ))}
                  </div>
                </div>
                {/* Timeline rows */}
                <TimelineRow label="Ramadan actie" color="#C87D3A" startCol={1} span={2} />
                <TimelineRow label="Bouwfonds campagne" color="#6B8F71" startCol={0} span={4} />
                <TimelineRow label="Vrijdagscollecte" color="#7B8EAD" startCol={2} span={3} />
                <TimelineRow label="Zomervakantie" color="#D4956A" startCol={3} span={2} />
                <div className="flex items-center mt-2 pt-1">
                  <span className="text-[10px] text-[#A09888]">+ Nieuwe campagne</span>
                </div>
              </div>

              {/* Bottom row: two side-by-side sections */}
              <div className="grid lg:grid-cols-2 gap-4">
                {/* Fund comparison — like Runway's Scenario Comparison */}
                <div className="bg-white rounded-xl border border-[#F0EBE3] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] font-semibold text-[#1A1917]">Fondsvergelijking</span>
                    <span className="text-[10px] bg-[#f9a600]/15 text-[#8a6d00] rounded px-2 py-0.5 font-medium">Analyseren</span>
                  </div>
                  {/* Table headers */}
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 text-[10px] text-[#A09888] font-medium border-b border-[#F0EBE3] pb-2 mb-1.5">
                    <span>Fonds</span>
                    <span className="w-[60px] text-right">Budget</span>
                    <span className="w-[60px] text-right">Werkelijk</span>
                    <span className="w-[50px] text-right">Verschil</span>
                  </div>
                  <ComparisonRow fund="Algemeen" budget="€3.000" actual="€4.280" diff="+42%" positive />
                  <ComparisonRow fund="Bouwfonds" budget="€2.000" actual="€1.640" diff="-18%" positive={false} />
                  <ComparisonRow fund="Onderwijs" budget="€800" actual="€950" diff="+19%" positive />
                  <ComparisonRow fund="Ramadan" budget="€1.500" actual="€2.100" diff="+40%" positive />
                </div>

                {/* Recent donations — compact list */}
                <div className="bg-white rounded-xl border border-[#F0EBE3] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] font-semibold text-[#1A1917]">Recente donaties</span>
                    <span className="text-[10px] text-[#C87D3A] font-medium">Alles bekijken →</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 text-[10px] text-[#A09888] font-medium border-b border-[#F0EBE3] pb-2 mb-1.5">
                    <span>Donor</span>
                    <span className="hidden sm:inline w-[60px]">Fonds</span>
                    <span className="w-[56px] text-right">Bedrag</span>
                    <span className="w-[48px] text-right">Datum</span>
                  </div>
                  <DonationRow name="Ahmed B." initials="AB" fund="Algemeen" amount="€50,00" date="13 mrt" />
                  <DonationRow name="Fatima K." initials="FK" fund="Bouwfonds" amount="€25,00" date="13 mrt" />
                  <DonationRow name="Anoniem" initials="?" fund="Ramadan" amount="€100,00" date="12 mrt" />
                  <DonationRow name="Yusuf M." initials="YM" fund="Onderwijs" amount="€35,00" date="12 mrt" />
                  <DonationRow name="Sara A." initials="SA" fund="Algemeen" amount="€75,00" date="11 mrt" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- Helper Components ---- */

function SidebarItem({ label, active, badge, arrow }: { label: string; active?: boolean; badge?: string; arrow?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-2.5 py-[5px] rounded-md cursor-default ${
      active
        ? "bg-[#C87D3A]/8 text-[#C87D3A] font-medium"
        : "text-[#6B6358]"
    }`}>
      <span className="flex-1 text-[12px]">{label}</span>
      {badge && <span className="text-[9px] bg-[#F0EBE3] text-[#6B6358] rounded-full px-1.5 py-0.5 font-medium">{badge}</span>}
      {arrow && <span className="text-[9px] text-[#A09888]">›</span>}
    </div>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={className}>
      <path d="M3 4l2 2 2-2" stroke="#8A7D6B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function KpiCard({ label, value, change, chartPath }: { label: string; value: string; change: string; chartPath: string }) {
  return (
    <div className="bg-white rounded-lg border border-[#F0EBE3] p-3">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-[#8A7D6B]">{label}</span>
        <span className="text-[9px] font-medium text-emerald-600">{change}</span>
      </div>
      <div className="text-[17px] font-bold text-[#1A1917] tracking-tight leading-tight">{value}</div>
      {/* Area chart */}
      <svg className="w-full h-[28px] mt-1" viewBox="0 0 120 32" fill="none" preserveAspectRatio="none">
        <path d={chartPath} stroke="#22c55e" strokeWidth="1.5" fill="none" />
        <path d={`${chartPath} V32 H0 Z`} fill="rgba(34,197,94,0.06)" />
      </svg>
    </div>
  )
}

function TimelineRow({ label, color, startCol, span }: { label: string; color: string; startCol: number; span: number }) {
  return (
    <div className="flex items-center py-1.5">
      <div className="w-[160px] lg:w-[180px] shrink-0 text-[11px] text-[#4A4540] flex items-center gap-1.5">
        <span className="text-[#A09888] text-[9px]">›</span>
        {label}
      </div>
      <div className="flex-1 grid grid-cols-6 gap-0 relative h-[22px]">
        <div
          className="absolute h-[18px] top-[2px] rounded-md flex items-center px-2"
          style={{
            left: `${(startCol / 6) * 100}%`,
            width: `${(span / 6) * 100}%`,
            backgroundColor: `${color}18`,
            border: `1px solid ${color}30`,
          }}
        >
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="1.5" fill="white"/></svg>
            </div>
            <span className="text-[8px] font-medium truncate" style={{ color }}>{label}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ComparisonRow({ fund, budget, actual, diff, positive }: { fund: string; budget: string; actual: string; diff: string; positive: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 py-2 border-b border-[#F8F5F0] last:border-0 text-[11px]">
      <span className="text-[#4A4540] font-medium">{fund}</span>
      <span className="w-[60px] text-right text-[#8A7D6B]">{budget}</span>
      <span className="w-[60px] text-right text-[#1A1917] font-medium">{actual}</span>
      <span className={`w-[50px] text-right font-medium ${positive ? "text-emerald-600" : "text-red-500"}`}>{diff}</span>
    </div>
  )
}

function DonationRow({ name, initials, fund, amount, date }: { name: string; initials: string; fund: string; amount: string; date: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center py-2 border-b border-[#F8F5F0] last:border-0 text-[11px]">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-5 h-5 rounded-full bg-[#F0EBE3] flex items-center justify-center text-[8px] font-bold text-[#6B6358] shrink-0">
          {initials}
        </div>
        <span className="text-[#1A1917] font-medium truncate">{name}</span>
      </div>
      <span className="hidden sm:inline w-[60px] text-[#8A7D6B] truncate">{fund}</span>
      <span className="w-[56px] text-right font-medium text-[#1A1917]">{amount}</span>
      <span className="w-[48px] text-right text-[#A09888]">{date}</span>
    </div>
  )
}
