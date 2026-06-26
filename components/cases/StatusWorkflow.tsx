'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Status } from '@prisma/client'
import { STATUS_CONFIG, WORKFLOW_STEPS } from '@/lib/constants'
import { Check, ChevronRight, Loader2, XCircle, PauseCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatusWorkflowProps {
  caseId: string
  currentStatus: Status
}

const TERMINAL_ACTIONS: Array<{ status: Status; label: string; icon: any; color: string }> = [
  { status: 'REJECTED', label: 'Mark as Rejected', icon: XCircle, color: 'text-red-600 border-red-200 hover:bg-red-50' },
  { status: 'ON_HOLD', label: 'Put on Hold', icon: PauseCircle, color: 'text-gray-500 border-gray-200 hover:bg-gray-50' },
]

export default function StatusWorkflow({ caseId, currentStatus }: StatusWorkflowProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [targetStatus, setTargetStatus] = useState<Status | null>(null)

  const currentIdx = WORKFLOW_STEPS.indexOf(currentStatus as any)
  const isTerminal = currentIdx === -1

  async function changeStatus(status: Status) {
    setLoading(true)
    try {
      await fetch(`/api/cases/${caseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: noteInput || undefined }),
      })
      router.refresh()
    } finally {
      setLoading(false)
      setNoteInput('')
      setShowNote(false)
      setTargetStatus(null)
    }
  }

  function initiateChange(status: Status) {
    setTargetStatus(status)
    setShowNote(true)
  }

  const nextStatus = !isTerminal && currentIdx < WORKFLOW_STEPS.length - 1
    ? WORKFLOW_STEPS[currentIdx + 1]
    : null

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
        <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">Status Workflow / Ροή Εργασίας</span>
      </div>

      {/* Step indicators */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {WORKFLOW_STEPS.map((step, idx) => {
            const cfg = STATUS_CONFIG[step]
            const done = !isTerminal && idx < currentIdx
            const current = !isTerminal && idx === currentIdx
            const future = isTerminal || idx > currentIdx

            return (
              <div key={step} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                      done ? 'bg-brand-teal border-brand-teal' :
                      current ? 'bg-brand-navy border-brand-navy scale-110' :
                      'bg-gray-50 border-gray-200'
                    )}
                  >
                    {done ? (
                      <Check size={14} className="text-white" />
                    ) : (
                      <span className={cn('text-[10px] font-bold', current ? 'text-white' : 'text-gray-400')}>
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[9px] font-semibold mt-1 text-center max-w-[60px] leading-tight',
                      current ? 'text-brand-navy' : done ? 'text-brand-teal' : 'text-gray-300'
                    )}
                  >
                    {cfg.label}
                  </span>
                </div>
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-6 mx-1 mb-4 flex-shrink-0',
                      done ? 'bg-brand-teal' : 'bg-gray-150'
                    )}
                  />
                )}
              </div>
            )
          })}

          {isTerminal && (
            <div className="ml-4 flex-shrink-0">
              <div className={cn('px-3 py-1.5 rounded-full text-xs font-bold border', STATUS_CONFIG[currentStatus].color)}>
                {STATUS_CONFIG[currentStatus].label}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {!loading && !showNote && (
        <div className="px-4 pb-4 flex items-center gap-3 flex-wrap">
          {nextStatus && (
            <button
              onClick={() => initiateChange(nextStatus as Status)}
              className="flex items-center gap-2 bg-brand-teal hover:bg-brand-navy-mid text-white
                         text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <ChevronRight size={14} />
              Advance to: {STATUS_CONFIG[nextStatus].label}
            </button>
          )}

          {!isTerminal && TERMINAL_ACTIONS.map(({ status, label, icon: Icon, color }) => (
            <button
              key={status}
              onClick={() => initiateChange(status)}
              className={cn('flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border transition-colors', color)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Note input before confirming */}
      {showNote && targetStatus && (
        <div className="px-4 pb-4 space-y-3">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-gray-700 mb-2">
              Changing status to: <span className="font-bold text-brand-navy">{STATUS_CONFIG[targetStatus].label}</span>
            </p>
            <textarea
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              placeholder="Optional note (e.g. estimator name, reason for rejection)…"
              className="input-base resize-none"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => changeStatus(targetStatus)}
              disabled={loading}
              className="flex items-center gap-2 bg-brand-teal text-white text-sm font-bold px-4 py-2 rounded-lg"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Confirm
            </button>
            <button
              onClick={() => { setShowNote(false); setTargetStatus(null) }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="px-4 pb-4 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={14} className="animate-spin" /> Updating status…
        </div>
      )}
    </div>
  )
}
