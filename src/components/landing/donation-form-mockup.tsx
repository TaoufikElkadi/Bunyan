export function DonationFormMockup() {
  return (
    <div className="w-full bg-white rounded-[12px] overflow-hidden shadow-[0_4px_32px_rgba(38,27,7,0.10)]">
      {/* Breadcrumb */}
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center gap-1.5 text-[12px] text-[#b5b0a5]">
          <span className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 16 16"
              fill="currentColor"
              opacity="0.5"
            >
              <path d="M2 4l6-3 6 3v1H2V4zm1 2h2v5H3V6zm4 0h2v5H7V6zm4 0h2v5h-2V6zM1 12h12v1H1v-1z" />
            </svg>
            Overzicht
          </span>
          <span className="opacity-40">&rsaquo;</span>
          <span className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 16 16"
              fill="currentColor"
              opacity="0.5"
            >
              <circle cx="8" cy="8" r="6" />
            </svg>
            Al-Fatiha Moskee
          </span>
        </div>
      </div>

      {/* Mosque icon + name */}
      <div className="px-6 pt-4 pb-1">
        <div className="flex items-center gap-2 text-[15px] font-semibold text-[#261b07]">
          <span className="flex items-center justify-center w-5 h-5 rounded bg-[#f9a600]/15 text-[10px]">
            🕌
          </span>
          Donatiepagina
          <svg
            className="w-3.5 h-3.5 text-[#b5b0a5]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
      </div>

      {/* Title */}
      <div className="px-6 pt-2 pb-4">
        <h3 className="text-[20px] font-bold text-[#261b07]">Fondsbeheer</h3>
      </div>

      {/* Table */}
      <div className="px-6 pb-2">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#eae7e0]">
              <th className="text-left font-normal text-[#8a8478] pb-2 pr-4 w-[45%]">
                Fonds
              </th>
              <th className="text-left font-normal text-[#8a8478] pb-2">
                Toewijzing
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1 */}
            <tr className="border-b border-[#f0ede6]">
              <td className="py-2.5 pr-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag color="#e8f0d4" text="Algemeen" />
                  <Tag color="#fef3c7" text="Moskee" />
                </div>
              </td>
              <td className="py-2.5">
                <div className="flex items-center gap-1 text-[12px] text-[#4a4539]">
                  <span>som(</span>
                  <RefPill text="iDEAL + Kaart + SEPA donaties" />
                </div>
              </td>
            </tr>

            {/* Row 2 */}
            <tr className="border-b border-[#f0ede6]">
              <td className="py-2.5 pr-4 pl-6">
                <div className="flex items-center gap-1.5">
                  <Tag color="#fef3c7" text="Bouwfonds" />
                  <Tag color="#fef3c7" text="Uitbreiding" />
                </div>
              </td>
              <td className="py-2.5 text-[12px] text-[#4a4539]">40%</td>
            </tr>

            {/* Row 3 */}
            <tr className="border-b border-[#f0ede6]">
              <td className="py-2.5 pr-4 pl-6">
                <div className="flex items-center gap-1.5">
                  <Tag color="#fef3c7" text="Onderwijs" />
                  <Tag color="#fde8d8" text="Jeugd" />
                </div>
              </td>
              <td className="py-2.5">
                <div className="flex items-center gap-1 text-[12px] text-[#4a4539]">
                  <Tag color="#f3f0ea" text="Terugkerend" />
                  <Tag color="#fef3c7" text="Maandelijks" />
                  <span className="ml-1">× €25</span>
                </div>
              </td>
            </tr>

            {/* Row 4 - highlighted */}
            <tr className="border-b border-[#f0ede6] relative">
              <td className="py-2.5 pr-4 pl-6 border-l-[3px] border-l-[#93a3c8]">
                <div className="flex items-center gap-1.5">
                  <Tag color="#dbe4f0" text="Ramadan" />
                  <Tag color="#dbe4f0" text="Campagne" />
                </div>
              </td>
              <td className="py-2.5">
                <div className="flex items-center gap-1 text-[12px] text-[#4a4539]">
                  <span>som(</span>
                  <RefPill text="QR + Donatiepagina + iDEAL" />
                </div>
              </td>
            </tr>

            {/* Rows behind popup */}
            <tr className="border-b border-[#f0ede6] opacity-40">
              <td className="py-2.5 pr-4 pl-12">
                <Tag color="#fef3c7" text="Zakat Al-M..." />
              </td>
              <td className="py-2.5"></td>
            </tr>
            <tr className="border-b border-[#f0ede6] opacity-30">
              <td className="py-2.5 pr-4 pl-12">
                <Tag color="#e8f0d4" text="Zakat Al-F..." />
              </td>
              <td className="py-2.5"></td>
            </tr>
            <tr className="border-b border-[#f0ede6] opacity-20">
              <td className="py-2.5 pr-4 pl-12">
                <Tag color="#fef3c7" text="Noodh..." />
              </td>
              <td className="py-2.5"></td>
            </tr>
            <tr className="border-b border-[#f0ede6] opacity-15">
              <td className="py-2.5 pr-4 pl-12">
                <Tag color="#fde8d8" text="Iftar..." />
              </td>
              <td className="py-2.5"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Popup overlay */}
      <div className="relative px-6 -mt-[90px] mb-4">
        <div className="relative ml-[30%] bg-white rounded-lg border border-[#e3e0d8] shadow-[0_8px_32px_rgba(38,27,7,0.12)] p-4 z-10">
          <p className="text-[13px] font-semibold text-[#261b07] mb-3">
            QR + Donatiepagina + iDEAL
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-[#8a8478]">Waar</span>
              <FilterPill icon text="Campagn..." />
              <span className="text-[#8a8478] bg-[#f8f7f5] px-2 py-1 rounded text-[11px]">
                is gelijk aan
              </span>
              <FilterPill text="Ramadan 2026" />
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-[#8a8478] ml-4">en</span>
              <FilterPill icon text="Methode..." />
              <span className="text-[#8a8478] bg-[#f8f7f5] px-2 py-1 rounded text-[11px]">
                is een van
              </span>
              <FilterPill text="iDEAL, QR" />
            </div>
          </div>
          <button className="mt-3 text-[12px] text-[#b5b0a5]">
            + Regel toevoegen
          </button>
        </div>
      </div>

      {/* Create fund */}
      <div className="px-6 pb-4">
        <span className="text-[13px] text-[#b5b0a5]">+ Fonds aanmaken</span>
      </div>

      {/* Divider */}
      <div className="border-t border-[#eae7e0] mx-6" />

      {/* Campaigns section */}
      <div className="px-6 pt-6 pb-8">
        <h3 className="text-[24px] font-bold text-[#d5d0c7]">
          Actieve campagnes
        </h3>
      </div>
    </div>
  );
}

function Tag({ color, text }: { color: string; text: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-[#4a4539] whitespace-nowrap"
      style={{ backgroundColor: color }}
    >
      {text}
    </span>
  );
}

function RefPill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#e3e0d8] bg-[#fafaf8] text-[11px] text-[#4a4539] whitespace-nowrap">
      <svg
        className="w-3 h-3 text-[#8a8478]"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h8v2H2v-2z" />
      </svg>
      {text}
    </span>
  );
}

function FilterPill({ text, icon }: { text: string; icon?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#e3e0d8] bg-white text-[11px] text-[#4a4539] whitespace-nowrap">
      {icon && (
        <svg
          className="w-3 h-3 text-[#8a8478]"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h8v2H2v-2z" />
        </svg>
      )}
      {text}
      <svg
        className="w-3 h-3 text-[#b5b0a5]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </span>
  );
}
