import { formatRelative } from '@/lib/utils'
import { Activity, CheckCircle2, Upload, FileEdit, RotateCcw } from 'lucide-react'

interface ActivityItem {
  id: string
  action: string
  details: string | null
  createdAt: Date | string
}

const ACTION_ICONS: Record<string, any> = {
  STATUS_CHANGED: RotateCcw,
  CASE_CREATED: CheckCircle2,
  FILE_UPLOADED: Upload,
  CASE_EDITED: FileEdit,
}

export default function ActivityLog({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">
          Activity Log / Ιστορικό
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {activities.map(a => {
          const Icon = ACTION_ICONS[a.action] || Activity
          return (
            <div key={a.id} className="flex items-start gap-3 px-4 py-3">
              <div className="w-7 h-7 rounded-full bg-brand-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={12} className="text-brand-teal" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{a.details || a.action}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatRelative(a.createdAt)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
