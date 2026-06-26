import { FileText, Wrench, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'

interface Stats {
  activeCases: number
  inRepair: number
  awaitingAuth: number
  completedThisMonth: number
  overdueCount: number
}

interface StatsCardsProps {
  stats: Stats
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Active Cases',
      value: stats.activeCases,
      icon: FileText,
      iconBg: 'bg-brand-teal/10',
      iconColor: 'text-brand-teal',
      border: 'border-l-brand-teal',
    },
    {
      label: 'In Repair',
      value: stats.inRepair,
      icon: Wrench,
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
      border: 'border-l-cyan-500',
    },
    {
      label: 'Awaiting Authorization',
      value: stats.awaitingAuth,
      icon: ShieldCheck,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      border: 'border-l-orange-500',
    },
    {
      label: 'Completed This Month',
      value: stats.completedThisMonth,
      icon: CheckCircle2,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      border: 'border-l-green-500',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, iconBg, iconColor, border }) => (
        <div
          key={label}
          className={`bg-white rounded-xl border border-gray-100 border-l-4 ${border} shadow-sm p-5`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-3xl font-black text-brand-navy mt-1">{value}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
              <Icon size={20} className={iconColor} />
            </div>
          </div>
        </div>
      ))}

      {/* Overdue alert — only show if there are overdue cases */}
      {stats.overdueCount > 0 && (
        <div className="col-span-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            <span className="font-bold">{stats.overdueCount}</span> case
            {stats.overdueCount !== 1 ? 's' : ''} have been in the same status for{' '}
            <span className="font-bold">14+ days</span> — review required.
          </p>
        </div>
      )}
    </div>
  )
}
