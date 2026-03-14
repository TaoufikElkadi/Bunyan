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
  '#C87D3A', // warm orange
  '#6B8F71', // sage green
  '#7B8EAD', // slate blue
  '#D4956A', // peach
  '#f9a600', // gold
  '#8a8478', // warm gray
  '#B8956A', // caramel
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
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-[13px] text-[#a09888]">
          Nog geen gegevens beschikbaar.
        </p>
      </div>
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
          innerRadius={65}
          outerRadius={100}
          label={false}
          strokeWidth={3}
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
            border: '1px solid #e3dfd5',
            borderRadius: '10px',
            boxShadow: '0 4px 24px rgba(38, 27, 7, 0.08)',
            fontSize: '13px',
            color: '#261b07',
          }}
        />
        <Legend
          formatter={(value: string) => {
            const item = data.find((d) => d.name === value)
            return `${value} (${item ? formatEuros(item.total) : ''})`
          }}
          wrapperStyle={{ fontSize: '12px', color: '#8a8478' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
