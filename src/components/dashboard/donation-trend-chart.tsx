'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const DUTCH_MONTHS: Record<string, string> = {
  '01': 'jan',
  '02': 'feb',
  '03': 'mrt',
  '04': 'apr',
  '05': 'mei',
  '06': 'jun',
  '07': 'jul',
  '08': 'aug',
  '09': 'sep',
  '10': 'okt',
  '11': 'nov',
  '12': 'dec',
}

type MonthlyData = { month: string; total: number }

const TIME_RANGES = [
  { key: '3M', label: '3M', months: 3 },
  { key: '6M', label: '6M', months: 6 },
  { key: '1J', label: '1J', months: 12 },
  { key: 'Alles', label: 'Alles', months: 0 },
] as const

function formatMonth(month: string): string {
  const parts = month.split('-')
  return DUTCH_MONTHS[parts[1]] ?? parts[1]
}

function formatEuros(cents: number): string {
  const euros = cents / 100
  if (euros >= 1000) {
    return `€${(euros / 1000).toFixed(1).replace('.0', '')}k`
  }
  return `€${euros.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function DonationTrendChart({ data }: { data: MonthlyData[] }) {
  const [range, setRange] = useState<string>('1J')

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-[13px] text-[#a09888]">
          Nog geen gegevens beschikbaar.
        </p>
      </div>
    )
  }

  const selectedRange = TIME_RANGES.find((r) => r.key === range)
  const sliceCount = selectedRange?.months || data.length
  const visibleData = data.slice(-sliceCount)

  const chartData = visibleData.map((d) => ({
    month: formatMonth(d.month),
    total: d.total,
  }))

  return (
    <div>
      {/* Time range tabs */}
      <div className="flex items-center gap-1 mb-5">
        {TIME_RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 ${
              range === r.key
                ? 'bg-[#261b07] text-white shadow-sm'
                : 'text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07]'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="donationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C87D3A" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#C87D3A" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ede6" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#b5b0a5', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#b5b0a5', fontWeight: 500 }}
            tickFormatter={(v: number) => formatEuros(v)}
            width={55}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={() => null}
            cursor={{ stroke: '#C87D3A', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#C87D3A"
            strokeWidth={2.5}
            fill="url(#donationGradient)"
            dot={false}
            activeDot={{
              r: 5,
              fill: '#C87D3A',
              stroke: '#fff',
              strokeWidth: 2.5,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
