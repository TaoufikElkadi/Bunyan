import type { ChurnRisk } from '@/types'

const RISK_CONFIG: Record<ChurnRisk, { label: string; color: string }> = {
  low: { label: 'Laag', color: 'bg-[#4a7c10]' },
  medium: { label: 'Gemiddeld', color: 'bg-[#f59e0b]' },
  high: { label: 'Hoog', color: 'bg-red-500' },
}

export function ChurnRiskIndicator({ risk }: { risk: ChurnRisk }) {
  const config = RISK_CONFIG[risk]
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2 w-2 rounded-full ${config.color}`} />
      <span className="text-[11px] text-[#8a8478]">{config.label}</span>
    </div>
  )
}
