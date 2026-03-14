'use client'

import {
  BarChart,
  Bar,
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

function formatMonth(month: string): string {
  const parts = month.split('-')
  return DUTCH_MONTHS[parts[1]] ?? parts[1]
}

function formatEuros(cents: number): string {
  return `\u20AC${(cents / 100).toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function MonthlyChart({
  data,
  color = '#C87D3A',
}: {
  data: MonthlyData[]
  color?: string
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-[13px] text-[#a09888]">
          Nog geen gegevens beschikbaar.
        </p>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    total: d.total,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3dfd5" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#a09888' }}
          axisLine={{ stroke: '#e3dfd5' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#a09888' }}
          tickFormatter={(v: number) => formatEuros(v)}
          width={70}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [formatEuros(Number(value)), 'Totaal']}
          labelFormatter={(label) => String(label)}
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e3dfd5',
            borderRadius: '10px',
            boxShadow: '0 4px 24px rgba(38, 27, 7, 0.08)',
            fontSize: '13px',
            color: '#261b07',
          }}
          cursor={{ fill: 'rgba(200, 125, 58, 0.06)' }}
        />
        <Bar dataKey="total" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
