import { prisma } from '@/lib/prisma'
import ContactsClient from '@/components/contacts/ContactsClient'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const [companies, officers, estimators] = await Promise.all([
    prisma.insuranceCompany.findMany({
      include: {
        officers: { select: { id: true, name: true, phone: true, email: true } },
        _count: { select: { estimatorLinks: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.officer.findMany({
      include: { company: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.estimator.findMany({
      include: {
        companyLinks: { include: { company: { select: { id: true, name: true } } } },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-brand-navy">Contacts / Επαφές</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Insurance companies, officers, and estimators
        </p>
      </div>
      <ContactsClient
        initialCompanies={companies as any}
        initialOfficers={officers as any}
        initialEstimators={estimators as any}
      />
    </div>
  )
}
