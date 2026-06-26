'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: '#009BB4',
  AWAITING_AUTHORIZATION: '#F59E0B',
  IN_REPAIR: '#3B82F6',
  AWAITING_PARTS: '#8B5CF6',
  COMPLETED: '#10B981',
  CANCELLED: '#6B7280',
}

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Received',
  AWAITING_AUTHORIZATION: 'Awaiting Auth',
  IN_REPAIR: 'In Repair',
  AWAITING_PARTS: 'Awaiting Parts',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

interface DataPoint { name: string; value: number; color: string }
interface Props { data: DataPoint[] }

export default function StatusChart({ data }: Props) {
  if (data.every(d => d.value === 0)) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-brand-navy uppercase tracking-widest mb-4">Cases by Status</h3>
        <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No cases yet</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-xs font-bold text-brand-navy uppercase tracking-widest mb-4">Cases by Status</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data.filter(d => d.value > 0)}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {data.filter(d => d.value > 0).map(entry => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [value, name]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => <span style={{ fontSize: 11, color: '#6B7280' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
