import { getDaysInStatus, getAgeColor } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { TERMINAL_STATUSES } from '@/lib/constants'
import { Status } from '@prisma/client'
import { Clock } from 'lucide-react'

interface AgeIndicatorProps {
  statusChangedAt: Date | string
  status: Status
}

export default function AgeIndicator({ statusChangedAt, status }: AgeIndicatorProps) {
  // Don't show age for terminal statuses
  if (TERMINAL_STATUSES.includes(status as typeof TERMINAL_STATUSES[number])) {
    return <span className="text-gray-300 text-xs">—</span>
  }

  const days = getDaysInStatus(statusChangedAt)
  const color = getAgeColor(days)

  const colorMap = {
    green: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
    red: 'text-red-600 bg-red-50 border-red-200 animate-pulse-slow',
  }

  const label = days === 0 ? 'Today' : days === 1 ? '1 day' : `${days} days`

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
        colorMap[color]
      )}
      title={`${days} day${days !== 1 ? 's' : ''} in current status`}
    >
      <Clock size={10} />
      {label}
    </span>
  )
}
