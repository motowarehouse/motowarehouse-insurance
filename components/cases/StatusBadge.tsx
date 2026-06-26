import { Status } from '@prisma/client'
import { STATUS_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: Status
  showGreek?: boolean
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, showGreek = false, size = 'md' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        cfg.color,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span className={cn('rounded-full flex-shrink-0', cfg.dot, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
      {showGreek ? cfg.labelGr : cfg.label}
    </span>
  )
}
