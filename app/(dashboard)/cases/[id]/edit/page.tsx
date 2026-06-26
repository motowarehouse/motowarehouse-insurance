import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ArrowLeft } from 'lucide-react'
import CaseForm from '@/components/cases/CaseForm'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function EditCasePage({ params }: { params: { id: string } }) {
  const c = await prisma.case.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      customerInsurance: true,
      thirdPartyInsurance: true,
      internal: true,
    },
  })

  if (!c) notFound()

  const defaultValues = {
    plate: c.plate,
    entryDate: format(new Date(c.entryDate), 'yyyy-MM-dd'),
    brand: c.brand,
    model: c.model,
    mileage: c.mileage?.toString() || '',
    vehicleRegistrationDate: c.vehicleRegistrationDate
      ? format(new Date(c.vehicleRegistrationDate), 'yyyy-MM-dd')
      : '',
    notes: c.notes || '',
    ownerName: c.owner?.name || '',
    ownerAddress: c.owner?.address || '',
    ownerPhone: c.owner?.phone || '',
    custCompany: c.customerInsurance?.company || '',
    custPhone: c.customerInsurance?.phone || '',
    custEmail: c.customerInsurance?.email || '',
    custEstimator: c.customerInsurance?.estimator || '',
    custOfficer: c.customerInsurance?.officer || '',
    custCaseNumber: c.customerInsurance?.caseNumber || '',
    tpCompany: c.thirdPartyInsurance?.company || '',
    tpPhone: c.thirdPartyInsurance?.phone || '',
    tpEmail: c.thirdPartyInsurance?.email || '',
    tpEstimator: c.thirdPartyInsurance?.estimator || '',
    tpOfficer: c.thirdPartyInsurance?.officer || '',
    tpCaseNumber: c.thirdPartyInsurance?.caseNumber || '',
    estimateNumber: c.internal?.estimateNumber || '',
    invoiceNumber: c.internal?.invoiceNumber || '',
    sentForPaymentDate: c.internal?.sentForPaymentDate
      ? format(new Date(c.internal.sentForPaymentDate), 'yyyy-MM-dd')
      : '',
    paymentDetails: c.internal?.paymentDetails || '',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/cases/${params.id}`}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand-teal transition-colors"
        >
          <ArrowLeft size={14} /> Back to Case
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-brand-navy">Edit Case — {c.plate}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{c.brand} {c.model}</p>
      </div>

      <CaseForm defaultValues={defaultValues} caseId={c.id} isEdit />
    </div>
  )
}
