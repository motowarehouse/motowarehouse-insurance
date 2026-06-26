'use client'

import Link from 'next/link'
import { Status, Brand } from '@prisma/client'
import { Eye, ChevronRight } from 'lucide-react'
import StatusBadge from '@/components/cases/StatusBadge'
import AgeIndicator from '@/components/cases/AgeIndicator'
import { BRAND_CONFIG } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

interface CaseRow {
  id: string
  plate: string
  brand: Brand
  model: string
  status: Status
  statusChangedAt: Date | string
  entryDate: Date | string
  owner: { name: string | null } | null
  customerInsurance: { company: string | null } | null
}

interface CasesTableProps {
  cases: CaseRow[]
}

export default function CasesTable({ cases }: CasesTableProps) {
  if (cases.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-lg font-medium">No cases found</p>
          <p className="text-sm mt-1">Create a new case to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-brand-navy text-white text-xs uppercase tracking-wider">
            <th className="px-4 py-3 text-left font-semibold">Plate</th>
            <th className="px-4 py-3 text-left font-semibold">Brand / Model</th>
            <th className="px-4 py-3 text-left font-semibold">Owner</th>
            <th className="px-4 py-3 text-left font-semibold">Insurance Co.</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">Age</th>
            <th className="px-4 py-3 text-left font-semibold">Entry Date</th>
            <th className="px-4 py-3 text-right font-semibold"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {cases.map((c, i) => {
            const brandCfg = BRAND_CONFIG[c.brand]
            return (
              <tr
                key={c.id}
                className="hover:bg-brand-row-tint/50 transition-colors group"
              >
                <td className="px-4 py-3">
                  <span className="font-black text-brand-navy tracking-widest text-sm">
                    {c.plate}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border ${brandCfg.color}`}
                    >
                      {brandCfg.label}
                    </span>
                    <span className="text-gray-700 font-medium">{c.model}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.owner?.name || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{c.customerInsurance?.company || '—'}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <AgeIndicator statusChangedAt={c.statusChangedAt} status={c.status} />
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(c.entryDate)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/cases/${c.id}`}
                    className="inline-flex items-center gap-1 text-brand-teal hover:text-brand-navy
                               text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    View <ChevronRight size={12} />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
