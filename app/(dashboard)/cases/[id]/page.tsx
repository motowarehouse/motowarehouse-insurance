import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ArrowLeft, Pencil, FileDown } from 'lucide-react'
import StatusBadge from '@/components/cases/StatusBadge'
import AgeIndicator from '@/components/cases/AgeIndicator'
import StatusWorkflow from '@/components/cases/StatusWorkflow'
import CaseDetailSections from '@/components/cases/CaseDetailSections'
import FileUploadSection from '@/components/cases/FileUploadSection'
import ActivityLog from '@/components/cases/ActivityLog'
import QuickNotes from '@/components/cases/QuickNotes'
import MessageTemplates from '@/components/cases/MessageTemplates'
import { BRAND_CONFIG } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const c = await prisma.case.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      customerInsurance: true,
      thirdPartyInsurance: true,
      internal: true,
      files: { orderBy: { uploadedAt: 'desc' } },
      activities: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!c) notFound()

  const brandCfg = BRAND_CONFIG[c.brand]

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/"
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand-teal transition-colors w-fit"
      >
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      {/* Case Header */}
      <div className="bg-brand-navy rounded-2xl p-6 flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-white tracking-widest">{c.plate}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${brandCfg.color}`}>
              {brandCfg.label}
            </span>
          </div>
          <p className="text-brand-teal-pale font-light text-sm">{c.model}</p>
          <div className="flex items-center gap-3 mt-3">
            <StatusBadge status={c.status} />
            <AgeIndicator statusChangedAt={c.statusChangedAt} status={c.status} />
            <span className="text-white/30 text-xs">Entered: {formatDate(c.entryDate)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/cases/${c.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-brand-teal/20 hover:bg-brand-teal/30 text-white
                       text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <FileDown size={14} /> PDF
          </a>
          <Link
            href={`/cases/${c.id}/edit`}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white
                       text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Pencil size={14} /> Edit Case
          </Link>
        </div>
      </div>

      {/* Status Workflow */}
      <StatusWorkflow caseId={c.id} currentStatus={c.status} />

      {/* Data sections */}
      <CaseDetailSections c={c} />

      {/* Files */}
      <FileUploadSection caseId={c.id} files={c.files} />

      {/* Quick Notes */}
      <QuickNotes caseId={c.id} />

      {/* Message Templates */}
      <MessageTemplates caseData={{
        plate: c.plate,
        model: c.model,
        ownerName: c.owner?.name,
        custCompany: c.customerInsurance?.company,
        custOfficer: c.customerInsurance?.officer,
        custCaseNumber: c.customerInsurance?.caseNumber,
        custEstimator: c.customerInsurance?.estimator,
        tpCompany: c.thirdPartyInsurance?.company,
        tpOfficer: c.thirdPartyInsurance?.officer,
        tpCaseNumber: c.thirdPartyInsurance?.caseNumber,
        tpEstimator: c.thirdPartyInsurance?.estimator,
      }} />

      {/* Activity log */}
      <ActivityLog activities={c.activities} />
    </div>
  )
}
