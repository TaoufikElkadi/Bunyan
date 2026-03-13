'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const COLORS = [
  '#8B7355', // brown
  '#A0926B', // tan
  '#6B8E7B', // sage
  '#C4A97D', // gold
  '#7B8B9E', // slate-blue
  '#B8956A', // caramel
  '#9B8B7A', // taupe
  '#6B7B6B', // olive
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

export function FundChart({ data }: { data: FundData[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Nog geen gegevens beschikbaar.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          label={false}
          strokeWidth={2}
          stroke="#ffffff"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatEuros(Number(value))}
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #f0ece8',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
            fontSize: '13px',
          }}
        />
        <Legend
          formatter={(value: string) => {
            const item = data.find((d) => d.name === value)
            return `${value} (${item ? formatEuros(item.total) : ''})`
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
