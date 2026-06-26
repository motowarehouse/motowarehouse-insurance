'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Status, Brand } from '@prisma/client'
import { Search, PlusCircle, SlidersHorizontal } from 'lucide-react'
import CasesTable from './CasesTable'
import { STATUS_CONFIG } from '@/lib/constants'

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

const STATUS_TABS: Array<{ key: Status | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'All Cases' },
  { key: 'INTAKE', label: 'Intake' },
  { key: 'AWAITING_ESTIMATOR', label: 'Awaiting Estimator' },
  { key: 'ESTIMATOR_VISIT', label: 'Estimator Visit' },
  { key: 'QUOTE_SENT', label: 'Quote Sent' },
  { key: 'QUOTE_APPROVED', label: 'Quote Approved' },
  { key: 'AWAITING_AUTHORIZATION', label: 'Awaiting Auth' },
  { key: 'AUTHORIZED', label: 'Authorized' },
  { key: 'IN_REPAIR', label: 'In Repair' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ON_HOLD', label: 'On Hold' },
]

const BRAND_FILTERS: Array<{ key: Brand | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'All Brands' },
  { key: 'SYM', label: 'SYM' },
  { key: 'CFMOTO', label: 'CFMOTO' },
  { key: 'OTHER', label: 'Other' },
]

export default function CasesTableClient({ initialCases }: { initialCases: CaseRow[] }) {
  const [search, setSearch] = useState('')
  const [activeStatus, setActiveStatus] = useState<Status | 'ALL'>('ALL')
  const [activeBrand, setActiveBrand] = useState<Brand | 'ALL'>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    return initialCases.filter(c => {
      const matchStatus = activeStatus === 'ALL' || c.status === activeStatus
      const matchBrand = activeBrand === 'ALL' || c.brand === activeBrand

      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        c.plate.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        (c.owner?.name?.toLowerCase().includes(q) ?? false) ||
        (c.customerInsurance?.company?.toLowerCase().includes(q) ?? false)

      const entryDate = new Date(c.entryDate)
      const matchFrom = !dateFrom || entryDate >= new Date(dateFrom)
      const matchTo = !dateTo || entryDate <= new Date(dateTo + 'T23:59:59')

      return matchStatus && matchBrand && matchSearch && matchFrom && matchTo
    })
  }, [initialCases, search, activeStatus, activeBrand, dateFrom, dateTo])

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: initialCases.length }
    for (const c of initialCases) {
      map[c.status] = (map[c.status] || 0) + 1
    }
    return map
  }, [initialCases])

  const brandCounts = useMemo(() => {
    const map: Record<string, number> = { ALL: initialCases.length }
    for (const c of initialCases) {
      map[c.brand] = (map[c.brand] || 0) + 1
    }
    return map
  }, [initialCases])

  const hasActiveFilters = activeBrand !== 'ALL' || dateFrom || dateTo

  function clearFilters() {
    setActiveBrand('ALL')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search plate, model, owner…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                       bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
          />
        </div>

        {/* Advanced filter toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-brand-teal text-white border-brand-teal'
              : 'bg-white text-gray-500 border-gray-200 hover:border-brand-teal hover:text-brand-teal'
          }`}
        >
          <SlidersHorizontal size={13} />
          Filters
          {hasActiveFilters && (
            <span className="bg-white/30 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">●</span>
          )}
        </button>

        <div className="ml-auto">
          <Link
            href="/cases/new"
            className="inline-flex items-center gap-2 bg-brand-teal hover:bg-brand-navy text-white
                       text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <PlusCircle size={15} />
            New Case
          </Link>
        </div>
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
          {/* Brand filter */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Brand</label>
            <div className="flex gap-1.5 flex-wrap">
              {BRAND_FILTERS.map(b => {
                const count = brandCounts[b.key] ?? 0
                const active = activeBrand === b.key
                return (
                  <button
                    key={b.key}
                    onClick={() => setActiveBrand(b.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                                transition-all border ${
                                  active
                                    ? 'bg-brand-navy text-white border-brand-navy'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-brand-teal hover:text-brand-teal'
                                }`}
                  >
                    {b.label}
                    {b.key !== 'ALL' && (
                      <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date range filter */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Entry Date Range</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  min={dateFrom}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
                />
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_TABS.map(tab => {
          const count = counts[tab.key] || 0
          if (tab.key !== 'ALL' && count === 0) return null
          const active = activeStatus === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveStatus(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                          transition-all border ${
                            active
                              ? 'bg-brand-navy text-white border-brand-navy'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-brand-teal hover:text-brand-teal'
                          }`}
            >
              {tab.label}
              <span
                className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <CasesTable cases={filtered} />

      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          Showing {filtered.length} of {initialCases.length} cases
        </p>
      )}
    </div>
  )
}
