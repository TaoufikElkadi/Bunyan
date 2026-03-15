'use client'

const COLORS = [
  '#C87D3A',
  '#6B8F71',
  '#7B8EAD',
  '#D4956A',
  '#f9a600',
  '#8a8478',
]

type FundData = { name: string; total: number }

function formatEuros(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function FundBars({ data }: { data: FundData[] }) {
  if (data.length === 0) {
    return (
      <p className="text-[12px] text-[#b5b0a5] py-4 text-center">
        Nog geen fondsen met donaties
      </p>
    )
  }

  const maxTotal = Math.max(...data.map((d) => d.total))

  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((fund, i) => {
        const pct = maxTotal > 0 ? (fund.total / maxTotal) * 100 : 0
        const color = COLORS[i % COLORS.length]

        return (
          <div key={fund.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-medium text-[#261b07] truncate">
                {fund.name}
              </span>
              <span className="text-[11px] font-semibold text-[#8a8478] tabular-nums ml-2 shrink-0">
                {formatEuros(fund.total)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#f3f1ec] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
