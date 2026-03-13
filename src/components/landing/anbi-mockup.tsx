export function AnbiMockup() {
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
            ANBI Rapportage
          </span>
        </div>
      </div>

      {/* Title + settings */}
      <div className="px-6 pt-5 pb-3 flex items-start justify-between">
        <h3 className="text-[22px] font-bold text-[#261b07]">Jaaropgaven 2025</h3>
        <button className="w-8 h-8 rounded-lg border border-[#e3e0d8] flex items-center justify-center text-[#8a8478]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
            <path d="M5 12h3m8 0h3M12 5V2m0 20v-3" />
          </svg>
        </button>
      </div>

      {/* Date header */}
      <div className="px-6 pb-1">
        <div className="text-right text-[11px] text-[#b5b0a5]">Belastingjaar 2025</div>
      </div>

      {/* Donor table */}
      <div className="px-6 pb-2">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#eae7e0]">
              <th className="text-left font-normal text-[#8a8478] pb-2 pr-4 w-[30%]">Donor</th>
              <th className="text-right font-normal pb-2 pr-4">
                <span className="inline-flex items-center gap-1 text-[#8a8478]">
                  <LinkIcon color="#8b9dc3" /> Totaal
                </span>
              </th>
              <th className="text-right font-normal pb-2 pr-4">
                <span className="inline-flex items-center gap-1 text-[#8a8478]">
                  <LinkIcon color="#8b9dc3" /> Aftrekbaar
                </span>
              </th>
              <th className="text-right font-normal text-[#8a8478] pb-2 pr-4">Status</th>
              <th className="text-right font-normal pb-2 w-[8%]">
                <span className="inline-flex items-center gap-1 text-[#8a8478]">
                  <LinkIcon color="#8b9dc3" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#f0ede6]">
              <td className="py-2.5 pr-4 text-[#4a4539]">Ahmed Benali</td>
              <td className="py-2.5 pr-4 text-right text-[#4a4539]">€1.240</td>
              <td className="py-2.5 pr-4 text-right text-[#4a4539]">€1.240</td>
              <td className="py-2.5 pr-4 text-right text-[#6aab35]">Verzonden</td>
              <td className="py-2.5"></td>
            </tr>
            {/* Highlighted row with cursor */}
            <tr className="border-b border-[#f0ede6]">
              <td className="py-2.5 pr-4 text-[#4a4539]">Fatima El Khattabi</td>
              <td className="py-2.5 pr-4 text-right text-[#4a4539]">€860</td>
              <td className="py-2.5 pr-4 text-right text-[#4a4539]">€860</td>
              <td className="py-2.5 pr-4 text-right relative">
                <svg className="absolute -left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-[#261b07]" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-8 2-3 8L5 3z"/></svg>
                <span className="inline-block px-1.5 py-0.5 rounded border border-[#a8b4d4] bg-[#eef1f8] text-[#6aab35]">Verzonden</span>
              </td>
              <td className="py-2.5"></td>
            </tr>
            <tr className="border-b border-[#f0ede6]">
              <td className="py-2.5 pr-4 text-[#4a4539]">Mohammed Amrani</td>
              <td className="py-2.5 pr-4 text-right text-[#4a4539]"></td>
              <td className="py-2.5 pr-4 text-right text-[#4a4539]"></td>
              <td className="py-2.5 pr-4 text-right text-[#f9a600]">Klaar</td>
              <td className="py-2.5"></td>
            </tr>
            <tr className="border-b border-[#f0ede6]">
              <td className="py-2.5 pr-4 text-[#4a4539]">Sara Mansouri</td>
              <td className="py-2.5 pr-4 text-right text-[#4a4539]"></td>
              <td className="py-2.5 pr-4 text-right text-[#4a4539]"></td>
              <td className="py-2.5 pr-4 text-right text-[#d94f4f]">BSN mist</td>
              <td className="py-2.5"></td>
            </tr>
            <tr className="border-b border-[#f0ede6]">
              <td className="py-2.5 pr-4 text-[#4a4539]">Youssef Tahiri</td>
              <td className="py-2.5 pr-4 text-right text-[#4a4539]"></td>
              <td className="py-2.5 pr-4 text-right text-[#4a4539]"></td>
              <td className="py-2.5 pr-4 text-right text-[#6aab35]">Verzonden</td>
              <td className="py-2.5"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Add donor */}
      <div className="px-6 pb-4">
        <span className="text-[12px] text-[#b5b0a5]">+ Donor toevoegen</span>
      </div>

      {/* AI Chat popup */}
      <div className="relative px-6 -mt-2 mb-4">
        <div className="relative ml-[25%] bg-white rounded-xl border border-[#e3e0d8] shadow-[0_8px_32px_rgba(38,27,7,0.12)] p-4 z-10">
          <p className="text-[13px] text-[#4a4539] leading-relaxed mb-3">
            Voor{" "}
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#f3f0ea] rounded text-[12px] font-medium">
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 10c2-4 4 2 6-2s4 0 6-4"/></svg>
              Sara Mansouri
            </span>{" "}
            ontbreekt het BSN-nummer. Zonder BSN kan de jaaropgave niet worden ingediend bij de Belastingdienst.
          </p>

          {/* Follow-up question */}
          <div className="bg-[#f5f4f1] rounded-lg px-3 py-2 mb-3 inline-block">
            <p className="text-[12px] text-[#4a4539]">Kun je een herinnering sturen?</p>
          </div>

          {/* Thinking indicator */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 rounded-full border-2 border-[#8b9dc3] border-t-transparent animate-spin" />
            <span className="text-[12px] text-[#8a8478]">Bezig...</span>
          </div>

          {/* Chat input */}
          <div className="border border-[#e3e0d8] rounded-lg px-3 py-2">
            <span className="text-[12px] text-[#b5b0a5]">Stel een vraag</span>
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-1.5 text-[#8a8478]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-8-8h16"/></svg>
                <LinkIcon color="#8a8478" />
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z"/></svg>
              </div>
              <div className="w-6 h-6 rounded-lg bg-[#f0ede6] flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-[#8a8478]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#eae7e0] mx-6" />

      {/* Compliance overview section */}
      <div className="px-6 pt-5 pb-2">
        <h3 className="text-[22px] font-bold text-[#d5d0c7] mb-3">Compliance overzicht</h3>
      </div>

      {/* Bottom summary rows (faded) */}
      <div className="px-6 pb-2">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#eae7e0]">
              <th className="text-left font-normal text-[#b5b0a5] pb-2 pr-4 w-[30%]">Veld</th>
              <th className="text-left font-normal text-[#b5b0a5] pb-2" colSpan={2}>Bron</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#f0ede6]">
              <td className="py-2.5 pr-4 text-[#b5b0a5]">
                <span className="flex items-center gap-1">RSIN-nummer <span className="text-[#c5c0b5]">&#9733;</span></span>
              </td>
              <td className="py-2.5 text-[#b5b0a5]">
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <Tag color="#f0ede6" text="Instellingen" />
                  <span>→</span>
                  <Tag color="#e8f0d4" text="ANBI gegevens" />
                </span>
              </td>
              <td className="py-2.5 text-right text-[#b5b0a5] text-[11px]">Gever...</td>
            </tr>
            <tr className="border-b border-[#f0ede6]">
              <td className="py-2.5 pr-4 text-[#b5b0a5] border-l-[3px] border-l-[#c5c0b5] pl-2">Totaal giften</td>
              <td className="py-2.5 text-[#b5b0a5]">
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <Tag color="#f0ede6" text="som(" />
                  <Tag color="#e8f0d4" text="Donaties" />
                  <Tag color="#fef3c7" text="2025" />
                  <span>)</span>
                </span>
              </td>
              <td className="py-2.5 text-right text-[#b5b0a5] text-[11px]">
                <span className="flex items-center gap-0.5 justify-end">&#9733; Tota...</span>
              </td>
            </tr>
            <tr className="border-b border-[#f0ede6]">
              <td className="py-2.5 pr-4 text-[#b5b0a5]">PDF-sjabloon</td>
              <td className="py-2.5 text-[#b5b0a5]">
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <span>&#9733; Belastingdienst</span>
                  <span>/</span>
                  <span className="text-[#c5c0b5] italic">Jaaropgave v2...</span>
                </span>
              </td>
              <td className="py-2.5 text-right text-[#b5b0a5] text-[11px]">
                <span className="flex items-center gap-0.5 justify-end">&#9733; PDF...</span>
              </td>
            </tr>
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

function Tag({ color, text }: { color: string; text: string }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-[#8a8478] whitespace-nowrap"
      style={{ backgroundColor: color }}
    >
      {text}
    </span>
  )
}
