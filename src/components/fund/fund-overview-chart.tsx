'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const COLORS = [
  '#C87D3A',
  '#6B8F71',
  '#7B8EAD',
  '#D4956A',
  '#f9a600',
  '#8a8478',
  '#B8956A',
  '#6B7B6B',
]

const DUTCH_MONTHS: Record<string, string> = {
  '01': 'jan', '02': 'feb', '03': 'mrt', '04': 'apr',
  '05': 'mei', '06': 'jun', '07': 'jul', '08': 'aug',
  '09': 'sep', '10': 'okt', '11': 'nov', '12': 'dec',
}

function formatMonth(month: string): string {
  const parts = month.split('-')
  return DUTCH_MONTHS[parts[1]] ?? parts[1]
}

function formatEuros(cents: number): string {
  const euros = cents / 100
  if (euros >= 1000) return `€${(euros / 1000).toFixed(1).replace('.0', '')}k`
  return `€${euros.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatEurosFull(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

interface FundOverviewChartProps {
  data: Record<string, unknown>[]
  fundNames: string[]
}

export function FundOverviewChart({ data, fundNames }: FundOverviewChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-[13px] text-[#a09888]">Nog geen gegevens beschikbaar.</p>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    month: formatMonth(d.month as string),
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} barGap={2}>
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
        <Tooltip
          formatter={(value, name) => [formatEurosFull(Number(value)), String(name)]}
          labelFormatter={(label) => String(label)}
          contentStyle={{
            backgroundColor: '#261b07',
            border: 'none',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(38, 27, 7, 0.2)',
            fontSize: '12px',
            color: '#f8f7f5',
            padding: '8px 14px',
          }}
          itemStyle={{ color: '#f8f7f5' }}
          labelStyle={{ color: '#a09888', fontSize: '11px', marginBottom: '4px' }}
          cursor={{ fill: 'rgba(38, 27, 7, 0.03)' }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '12px', color: '#8a8478', paddingTop: '12px' }}
        />
        {fundNames.map((name, i) => (
          <Bar
            key={name}
            dataKey={name}
            fill={COLORS[i % COLORS.length]}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
