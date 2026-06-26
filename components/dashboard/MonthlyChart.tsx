'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface DataPoint { month: string; count: number }
interface Props { data: DataPoint[] }

export default function MonthlyChart({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-xs font-bold text-brand-navy uppercase tracking-widest mb-4">Cases Entered (Last 6 Months)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
            cursor={{ fill: '#F9FAFB' }}
          />
          <Bar dataKey="count" fill="#009BB4" radius={[4, 4, 0, 0]} name="Cases" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
