import { prisma } from '@/lib/prisma'
import { getDaysInStatus } from '@/lib/utils'
import { TERMINAL_STATUSES } from '@/lib/constants'
import { startOfMonth, subMonths, format } from 'date-fns'
import StatsCards from '@/components/dashboard/StatsCards'
import CasesTableClient from '@/components/dashboard/CasesTableClient'
import StatusChart from '@/components/dashboard/StatusChart'
import MonthlyChart from '@/components/dashboard/MonthlyChart'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const now = new Date()
  const monthStart = startOfMonth(now)

  // Fetch all non-deleted cases with needed relations
  const allCases = await prisma.case.findMany({
    include: {
      owner: { select: { name: true } },
      customerInsurance: { select: { company: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Compute stats
  const activeCases = allCases.filter(
    c => !TERMINAL_STATUSES.includes(c.status as any)
  ).length

  const inRepair = allCases.filter(c => c.status === 'IN_REPAIR').length
  const awaitingAuth = allCases.filter(c => c.status === 'AWAITING_AUTHORIZATION').length
  const completedThisMonth = allCases.filter(
    c => c.status === 'COMPLETED' && new Date(c.updatedAt) >= monthStart
  ).length

  const overdueCount = allCases.filter(c => {
    if (TERMINAL_STATUSES.includes(c.status as any)) return false
    return getDaysInStatus(c.statusChangedAt) > 14
  }).length

  // Status chart data
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

  const statusCounts: Record<string, number> = {}
  for (const c of allCases) {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1
  }

  const statusData = Object.keys(STATUS_LABELS).map(status => ({
    name: STATUS_LABELS[status],
    value: statusCounts[status] || 0,
    color: STATUS_COLORS[status],
  }))

  // Monthly chart data (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i)
    const label = format(d, 'MMM yy')
    const count = allCases.filter(c => {
      const entered = new Date(c.entryDate)
      return entered.getFullYear() === d.getFullYear() && entered.getMonth() === d.getMonth()
    }).length
    return { month: label, count }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-navy">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {allCases.length} total case{allCases.length !== 1 ? 's' : ''} · All insurance claims
          </p>
        </div>
      </div>

      {/* Stats */}
      <StatsCards
        stats={{ activeCases, inRepair, awaitingAuth, completedThisMonth, overdueCount }}
      />

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <StatusChart data={statusData} />
        <MonthlyChart data={monthlyData} />
      </div>

      {/* Table with client-side filtering */}
      <CasesTableClient initialCases={allCases} />
    </div>
  )
}
