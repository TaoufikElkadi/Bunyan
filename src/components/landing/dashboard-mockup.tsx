/**
 * Dashboard mockup for the landing page hero.
 * Matches the runway.com style: no browser chrome, just the product UI
 * with rounded corners and subtle shadow, sitting in the gradient.
 */
export function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-[1100px] px-4 sm:px-6">
      {/* The mockup card — rounded top, open bottom (fades out) */}
      <div className="relative rounded-t-xl sm:rounded-t-2xl bg-white border border-[#E0D9CE] border-b-0 shadow-[0_-4px_60px_-12px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="flex min-h-[400px] sm:min-h-[520px] lg:min-h-[600px]">
          {/* ---- Sidebar ---- */}
          <div className="hidden md:flex flex-col w-[220px] lg:w-[250px] border-r border-[#F0EBE3] bg-[#FAFAF8] shrink-0">
            {/* Sidebar header */}
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#F0EBE3]">
              <div className="w-6 h-6 rounded bg-[#F0EBE3] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="4" height="4" rx="1" fill="#8A7D6B"/><rect x="7" y="1" width="4" height="4" rx="1" fill="#8A7D6B"/><rect x="1" y="7" width="4" height="4" rx="1" fill="#8A7D6B"/><rect x="7" y="7" width="4" height="4" rx="1" fill="#C87D3A"/></svg>
              </div>
              <span className="text-[13px] font-medium text-[#1A1917]">Al-Fatiha Moskee</span>
              <ChevronIcon className="ml-auto" />
            </div>

            {/* Nav sections */}
            <div className="px-3 py-4 flex-1">
              <div className="text-[10px] font-semibold tracking-wider uppercase text-[#A09888] px-3 mb-2">Overzicht</div>
              <nav className="space-y-0.5 mb-5">
                <SidebarItem icon="home" label="Dashboard" active />
                <SidebarItem icon="chart" label="Donatie-analyse" />
                <SidebarItem icon="doc" label="Rapporten" />
              </nav>

              <div className="text-[10px] font-semibold tracking-wider uppercase text-[#A09888] px-3 mb-2">Beheer</div>
              <nav className="space-y-0.5 mb-5">
                <SidebarItem icon="heart" label="Donaties" count="24" />
                <SidebarItem icon="users" label="Donoren" />
                <SidebarItem icon="folder" label="Fondsen" />
                <SidebarItem icon="campaign" label="Campagnes" />
              </nav>

              <div className="text-[10px] font-semibold tracking-wider uppercase text-[#A09888] px-3 mb-2">Tools</div>
              <nav className="space-y-0.5">
                <SidebarItem icon="qr" label="QR-codes" />
                <SidebarItem icon="receipt" label="ANBI-opgaven" />
              </nav>
            </div>
          </div>

          {/* ---- Main content ---- */}
          <div className="flex-1 bg-[#FEFEFE] min-w-0">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#F0EBE3]">
              <div className="flex items-center gap-2 text-[12px] text-[#8A7D6B]">
                <span>🏠</span>
                <span>Overzicht</span>
                <span className="text-[#D0C9BC]">›</span>
                <span className="text-[#1A1917] font-medium">Dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 bg-[#F5F2ED] rounded-md px-3 py-1.5">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="3.5" stroke="#8A7D6B" strokeWidth="1.2"/><line x1="7.5" y1="7.5" x2="10.5" y2="10.5" stroke="#8A7D6B" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  <span className="text-[11px] text-[#A09888]">Zoeken...</span>
                </div>
                <div className="w-7 h-7 rounded-full bg-[#C87D3A] flex items-center justify-center">
                  <span className="text-white text-[11px] font-bold">TM</span>
                </div>
              </div>
            </div>

            {/* Content area */}
            <div className="p-4 sm:p-6">
              {/* KPI row — 4 cards like runway.com's ARR/Cash/ACV/Runway */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <KpiCard label="Deze maand" value="€4.280" trend="up" change="▲ €520" />
                <KpiCard label="MRR" value="€1.850" trend="up" change="▲ €148" />
                <KpiCard label="Gem. gift" value="€35" trend="up" change="▲ €3" />
                <KpiCard label="Nieuwe donoren" value="12" trend="up" change="▲ 3" />
              </div>

              {/* Charts section — like runway's Exec Dashboard charts */}
              <div className="grid lg:grid-cols-[1fr_340px] gap-4 mb-6">
                {/* Main chart */}
                <div className="bg-white rounded-xl border border-[#F0EBE3] p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[14px] font-semibold text-[#1A1917]">Donaties per maand</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#A09888] bg-[#F5F2ED] px-2 py-0.5 rounded">2026</span>
                    </div>
                  </div>
                  <TrendChart />
                </div>

                {/* Fund breakdown */}
                <div className="bg-white rounded-xl border border-[#F0EBE3] p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[14px] font-semibold text-[#1A1917]">Per fonds</span>
                  </div>
                  <FundBreakdown />
                </div>
              </div>

              {/* Recent donations table — like runway's Scenario Comparison */}
              <div className="bg-white rounded-xl border border-[#F0EBE3] p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[14px] font-semibold text-[#1A1917]">Recente donaties</span>
                  <span className="text-[11px] text-[#C87D3A] font-medium cursor-pointer hover:underline">Alles bekijken →</span>
                </div>
                <DonationTable />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- Helper Components ---- */

function SidebarItem({ icon, label, active, count }: { icon: string; label: string; active?: boolean; count?: string }) {
  const icons: Record<string, React.ReactNode> = {
    home: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 5.5L7 2l5 3.5V12H2V5.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
    chart: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="7" width="2" height="5" rx="0.5" fill="currentColor"/><rect x="6" y="4" width="2" height="8" rx="0.5" fill="currentColor"/><rect x="10" y="2" width="2" height="10" rx="0.5" fill="currentColor"/></svg>,
    doc: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="1.5" width="8" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/><line x1="5.5" y1="5" x2="8.5" y2="5" stroke="currentColor" strokeWidth="1"/><line x1="5.5" y1="7.5" x2="8.5" y2="7.5" stroke="currentColor" strokeWidth="1"/></svg>,
    heart: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 12s-5-3.5-5-6.5C2 3.5 4 2 5.5 2S7 3 7 3s.5-1 2.5-1S12 3.5 12 5.5C12 8.5 7 12 7 12z" stroke="currentColor" strokeWidth="1.2"/></svg>,
    users: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 12c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="10" cy="4" r="1.5" stroke="currentColor" strokeWidth="1"/><path d="M9 8.5c1 0 2.5 1 2.5 2.5" stroke="currentColor" strokeWidth="1"/></svg>,
    folder: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4V3a1 1 0 011-1h3l1.5 1.5H11a1 1 0 011 1V11a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.2"/></svg>,
    campaign: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5h2v6H3zM7 2h2v9H7z" fill="currentColor"/><path d="M11 4l-2 1v4l2 1V4z" stroke="currentColor" strokeWidth="1.2"/></svg>,
    qr: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="2" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/><rect x="2" y="8" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="9" width="2" height="2" fill="currentColor"/></svg>,
    receipt: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 1.5l1 1 1-1 1 1 1-1 1 1 1-1 1 1 1-1v11l-1-1-1 1-1-1-1 1-1-1-1 1-1-1-1 1V1.5z" stroke="currentColor" strokeWidth="1.2"/><line x1="5" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1"/><line x1="5" y1="7.5" x2="9" y2="7.5" stroke="currentColor" strokeWidth="1"/></svg>,
  }

  return (
    <div className={`flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] cursor-default ${
      active
        ? "bg-[#C87D3A]/8 text-[#C87D3A] font-medium"
        : "text-[#6B6358] hover:bg-[#F5F2ED]"
    }`}>
      <span className={active ? "text-[#C87D3A]" : "text-[#A09888]"}>{icons[icon]}</span>
      <span className="flex-1">{label}</span>
      {count && <span className="text-[10px] bg-[#F0EBE3] text-[#6B6358] rounded-full px-1.5 py-0.5 font-medium">{count}</span>}
    </div>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={className}>
      <path d="M4 5l2 2 2-2" stroke="#8A7D6B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function KpiCard({ label, value, trend, change }: { label: string; value: string; trend: "up" | "down"; change: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#F0EBE3] p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] sm:text-[12px] text-[#8A7D6B]">{label}</span>
        <span className={`text-[10px] sm:text-[11px] font-medium ${trend === "up" ? "text-emerald-600" : "text-red-500"}`}>{change}</span>
      </div>
      <div className="text-[18px] sm:text-[22px] font-bold text-[#1A1917] tracking-tight">{value}</div>
      {/* Mini sparkline */}
      <svg className="w-full h-6 mt-1.5" viewBox="0 0 120 24" fill="none">
        <path
          d={trend === "up"
            ? "M0 20 Q15 18 25 16 T50 14 T75 10 T100 6 T120 4"
            : "M0 8 Q15 10 25 12 T50 14 T75 16 T100 18 T120 20"
          }
          stroke={trend === "up" ? "#22c55e" : "#ef4444"}
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d={trend === "up"
            ? "M0 20 Q15 18 25 16 T50 14 T75 10 T100 6 T120 4 V24 H0Z"
            : "M0 8 Q15 10 25 12 T50 14 T75 16 T100 18 T120 20 V24 H0Z"
          }
          fill={trend === "up" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)"}
        />
      </svg>
    </div>
  )
}

function TrendChart() {
  const bars = [
    { month: "Jan", h: 55 }, { month: "Feb", h: 40 }, { month: "Mrt", h: 65 },
    { month: "Apr", h: 50 }, { month: "Mei", h: 75 }, { month: "Jun", h: 60 },
    { month: "Jul", h: 70 }, { month: "Aug", h: 55 }, { month: "Sep", h: 85 },
    { month: "Okt", h: 65 }, { month: "Nov", h: 78 }, { month: "Dec", h: 90 },
  ]

  return (
    <div>
      {/* SVG trend line overlay */}
      <svg className="w-full h-[120px] sm:h-[150px]" viewBox="0 0 480 120" preserveAspectRatio="none" fill="none">
        {/* Grid lines */}
        {[0, 30, 60, 90].map(y => (
          <line key={y} x1="0" y1={y} x2="480" y2={y} stroke="#F0EBE3" strokeWidth="0.5" />
        ))}
        {/* Bars */}
        {bars.map((bar, i) => {
          const x = i * 40 + 8
          const barH = bar.h * 1.1
          return (
            <rect
              key={i}
              x={x}
              y={120 - barH}
              width="24"
              height={barH}
              rx="3"
              fill={i === bars.length - 1 ? "#C87D3A" : "#E8E0D4"}
            />
          )
        })}
        {/* Trend line */}
        <path
          d="M20 65 Q60 78 100 55 T180 50 T260 35 T340 40 T420 22 T480 15"
          stroke="#C87D3A"
          strokeWidth="2"
          strokeDasharray="4 3"
          fill="none"
          opacity="0.6"
        />
      </svg>
      {/* Month labels */}
      <div className="flex justify-between mt-1.5 px-1">
        {bars.map(bar => (
          <span key={bar.month} className="text-[9px] sm:text-[10px] text-[#A09888]">{bar.month}</span>
        ))}
      </div>
    </div>
  )
}

function FundBreakdown() {
  const funds = [
    { name: "Algemeen fonds", amount: "€2.140", pct: 50, color: "#C87D3A" },
    { name: "Bouwfonds", amount: "€980", pct: 23, color: "#6B8F71" },
    { name: "Onderwijs", amount: "€650", pct: 15, color: "#7B8EAD" },
    { name: "Ramadan", amount: "€510", pct: 12, color: "#D4956A" },
  ]

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden">
        {funds.map(f => (
          <div key={f.name} style={{ width: `${f.pct}%`, backgroundColor: f.color }} />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-2.5 mt-4">
        {funds.map(f => (
          <div key={f.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: f.color }} />
              <span className="text-[12px] text-[#4A4540]">{f.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-[#1A1917]">{f.amount}</span>
              <span className="text-[10px] text-[#A09888] w-8 text-right">{f.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DonationTable() {
  const donations = [
    { donor: "Ahmed B.", email: "ahmed@...", fund: "Algemeen", amount: "€50,00", method: "iDEAL", date: "13 mrt" },
    { donor: "Fatima K.", email: "fatima@...", fund: "Bouwfonds", amount: "€25,00", method: "Card", date: "13 mrt" },
    { donor: "Anoniem", email: "—", fund: "Ramadan", amount: "€100,00", method: "iDEAL", date: "12 mrt" },
    { donor: "Yusuf M.", email: "yusuf@...", fund: "Onderwijs", amount: "€35,00", method: "SEPA", date: "12 mrt" },
  ]

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-[#F0EBE3]">
            <th className="text-left font-medium text-[#8A7D6B] pb-2.5 pr-4">Donor</th>
            <th className="text-left font-medium text-[#8A7D6B] pb-2.5 pr-4 hidden sm:table-cell">Fonds</th>
            <th className="text-left font-medium text-[#8A7D6B] pb-2.5 pr-4 hidden lg:table-cell">Methode</th>
            <th className="text-right font-medium text-[#8A7D6B] pb-2.5 pr-4">Bedrag</th>
            <th className="text-right font-medium text-[#8A7D6B] pb-2.5">Datum</th>
          </tr>
        </thead>
        <tbody>
          {donations.map((d, i) => (
            <tr key={i} className="border-b border-[#F8F5F0] last:border-0">
              <td className="py-2.5 pr-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#F0EBE3] flex items-center justify-center text-[9px] font-bold text-[#6B6358]">
                    {d.donor.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[#1A1917] font-medium">{d.donor}</div>
                    <div className="text-[10px] text-[#A09888]">{d.email}</div>
                  </div>
                </div>
              </td>
              <td className="py-2.5 pr-4 text-[#6B6358] hidden sm:table-cell">{d.fund}</td>
              <td className="py-2.5 pr-4 hidden lg:table-cell">
                <span className="text-[10px] bg-[#F5F2ED] text-[#6B6358] rounded px-1.5 py-0.5">{d.method}</span>
              </td>
              <td className="py-2.5 pr-4 text-right font-medium text-[#1A1917]">{d.amount}</td>
              <td className="py-2.5 text-right text-[#A09888]">{d.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
