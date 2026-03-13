export function ChartsMockup() {
  return (
    <div className="w-full bg-white rounded-[12px] overflow-hidden shadow-[0_4px_32px_rgba(38,27,7,0.10)]">
      {/* Breadcrumb */}
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center gap-1.5 text-[12px] text-[#b5b0a5]">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" opacity="0.5"><path d="M2 4l6-3 6 3v1H2V4zm1 2h2v5H3V6zm4 0h2v5H7V6zm4 0h2v5h-2V6zM1 12h12v1H1v-1z"/></svg>
            Overzicht
          </span>
          <span className="opacity-40">&rsaquo;</span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" opacity="0.5"><circle cx="8" cy="8" r="6"/></svg>
            Dashboard
          </span>
        </div>
      </div>

      {/* Title + settings */}
      <div className="px-6 pt-5 pb-4 flex items-start justify-between">
        <h3 className="text-[20px] font-bold text-[#261b07]">Maart vs. Vorig jaar</h3>
        <button className="w-8 h-8 rounded-lg border border-[#e3e0d8] flex items-center justify-center text-[#8a8478] hover:bg-[#f8f7f5]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
            <path d="M5 12h3m8 0h3M12 5V2m0 20v-3" />
          </svg>
        </button>
      </div>

      {/* Dropdown popup */}
      <div className="relative px-6 -mt-1 mb-2">
        <div className="absolute right-6 top-0 w-[210px] bg-white rounded-lg border border-[#e3e0d8] shadow-[0_8px_32px_rgba(38,27,7,0.12)] z-20 py-2">
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded border border-[#e3e0d8] bg-[#fafaf8]">
              <svg className="w-3.5 h-3.5 text-[#b5b0a5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <span className="text-[12px] text-[#b5b0a5]">Zoeken</span>
            </div>
          </div>
          <PeriodOption text="Mrt 2026" color="#8b9dc3" checked />
          <PeriodOption text="Mrt 2025" color="#8b9dc3" checked />
          <PeriodOption text="Feb 2026" color="#a8c98a" />
          <PeriodOption text="Ramadan 2025" color="#a8c98a" />
        </div>
      </div>

      {/* Main comparison table */}
      <div className="px-6 pt-2 pb-2">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#eae7e0]">
              <th className="text-left font-normal text-[#8a8478] pb-2 pr-4 w-[35%]">Metriek</th>
              <th className="text-right font-normal pb-2 pr-4">
                <span className="inline-flex items-center gap-1 text-[#8a8478]">
                  <LinkIcon color="#8b9dc3" /> Mrt &apos;26
                </span>
              </th>
              <th className="text-right font-normal pb-2 pr-4">
                <span className="inline-flex items-center gap-1 text-[#8a8478]">
                  <LinkIcon color="#8b9dc3" /> <span className="opacity-40">Mrt...</span>
                </span>
              </th>
              <th className="text-right font-normal pb-2 w-[18%]"></th>
            </tr>
          </thead>
          <tbody>
            <ComparisonRow driver="Totaal donaties" base="€4.280" compare="€3.150" variance="+€1.130" positive />
            <ComparisonRow driver="Terugkerend (MRR)" base="€1.850" compare="€1.200" variance="+€650" positive />
            <ComparisonRow driver="Actieve donoren" base="142" compare="98" variance="+44" positive />
            <ComparisonRow driver="Gem. gift" base="€35" compare="€42" variance="-€7" negative />
            <ComparisonRow driver="Uitvalpercentage" base="4,2%" compare="6,8%" variance="-2,6%" positive />
          </tbody>
        </table>
      </div>

      {/* Add metric */}
      <div className="px-6 pb-5">
        <span className="text-[12px] text-[#b5b0a5]">+ Metriek toevoegen</span>
      </div>

      {/* Divider */}
      <div className="border-t border-[#eae7e0] mx-6" />

      {/* Per Fonds section */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <h3 className="text-[22px] font-bold text-[#d5d0c7]">Per fonds</h3>
        <button className="w-7 h-7 rounded-lg border border-[#e8e5de] flex items-center justify-center text-[#c5c0b5]">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
            <path d="M5 12h3m8 0h3M12 5V2m0 20v-3" />
          </svg>
        </button>
      </div>

      {/* Fund date header */}
      <div className="px-6 pb-1">
        <div className="text-right text-[11px] text-[#b5b0a5]">Mrt &apos;26</div>
      </div>

      {/* Per fonds table */}
      <div className="px-6 pb-6">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#eae7e0]">
              <th className="text-left font-normal text-[#b5b0a5] pb-2 pr-4 w-[28%]">Fonds</th>
              <th className="text-right font-normal pb-2 pr-4">
                <span className="inline-flex items-center gap-1 text-[#b5b0a5]">
                  <LinkIcon color="#8b9dc3" /> Mrt &apos;26
                </span>
              </th>
              <th className="text-right font-normal pb-2 pr-4">
                <span className="inline-flex items-center gap-1 text-[#b5b0a5]">
                  <LinkIcon color="#8b9dc3" /> Mrt &apos;25
                </span>
              </th>
              <th className="text-right font-normal text-[#b5b0a5] pb-2 pr-4">Verschil</th>
              <th className="text-right font-normal pb-2">
                <span className="inline-flex items-center gap-1 text-[#b5b0a5]">
                  <LinkIcon color="#8b9dc3" /> Doel
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <FundRow fund="Algemeen" current="€2.140" previous="€1.680" variance="+€460" positive />
            <FundRow fund="Bouwfonds" current="€980" previous="€820" variance="+€160" positive />
            <FundRow fund="Onderwijs" current="€650" previous="€410" variance="+€240" positive />
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LinkIcon({ color }: { color: string }) {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill={color}>
      <path d="M6.5 3A3.5 3.5 0 003 6.5v3A3.5 3.5 0 006.5 13h.5v-1.5h-.5A2 2 0 014.5 9.5v-3A2 2 0 016.5 4.5h3A2 2 0 0111.5 6.5v.5H13v-.5A3.5 3.5 0 009.5 3h-3z"/>
      <path d="M9.5 13A3.5 3.5 0 0013 9.5v-3A3.5 3.5 0 009.5 3H9v1.5h.5A2 2 0 0111.5 6.5v3A2 2 0 019.5 11.5h-3A2 2 0 014.5 9.5V9H3v.5A3.5 3.5 0 006.5 13h3z"/>
    </svg>
  )
}

function PeriodOption({ text, color, checked }: { text: string; color: string; checked?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-[#f8f7f5] cursor-pointer">
      {checked ? (
        <svg className="w-4 h-4 text-[#4a90d9]" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
      ) : (
        <span className="w-4 h-4" />
      )}
      <LinkIcon color={color} />
      <span className="text-[13px] text-[#4a4539]">{text}</span>
    </div>
  )
}

function ComparisonRow({
  driver, base, compare, variance, positive, negative,
}: {
  driver: string; base: string; compare?: string; variance?: string; positive?: boolean; negative?: boolean
}) {
  return (
    <tr className="border-b border-[#f0ede6]">
      <td className="py-2.5 pr-4 text-[#4a4539]">{driver}</td>
      <td className="py-2.5 pr-4 text-right text-[#4a4539]">{base}</td>
      <td className="py-2.5 pr-4 text-right text-[#4a4539]">{compare}</td>
      <td className="py-2.5 text-right">
        {variance && (
          <span className={positive ? "text-[#6aab35]" : negative ? "text-[#d94f4f]" : "text-[#4a4539]"}>
            {variance}
          </span>
        )}
      </td>
    </tr>
  )
}

function FundRow({
  fund, current, previous, variance, positive, negative,
}: {
  fund: string; current: string; previous: string; variance: string; positive?: boolean; negative?: boolean
}) {
  return (
    <tr className="border-b border-[#f0ede6]">
      <td className="py-2.5 pr-4 text-[#b5b0a5]">{fund}</td>
      <td className="py-2.5 pr-4 text-right text-[#b5b0a5]">{current}</td>
      <td className="py-2.5 pr-4 text-right text-[#b5b0a5]">{previous}</td>
      <td className="py-2.5 pr-4 text-right">
        <span className={positive ? "text-[#6aab35]/60" : negative ? "text-[#d94f4f]/60" : "text-[#b5b0a5]"}>
          {variance}
        </span>
      </td>
      <td className="py-2.5 text-right text-[#b5b0a5]"></td>
    </tr>
  )
}
