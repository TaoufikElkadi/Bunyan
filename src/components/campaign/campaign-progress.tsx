import { formatMoney } from '@/lib/money'

type Props = {
  raised: number
  goal: number
  primaryColor: string
}

export function CampaignProgress({ raised, goal, primaryColor }: Props) {
  const percentage = Math.min(100, Math.round((raised / goal) * 100))

  return (
    <div className="space-y-2">
      <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: primaryColor,
          }}
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {formatMoney(raised)} van {formatMoney(goal)} opgehaald
        </span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
    </div>
  )
}
