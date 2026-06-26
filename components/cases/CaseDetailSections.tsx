import { Bike, User, Shield, Building2, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface CaseWithAll {
  brand: string
  model: string
  plate: string
  entryDate: Date | string
  mileage: number | null
  vehicleRegistrationDate: Date | string | null
  notes: string | null
  owner: { name: string | null; address: string | null; phone: string | null } | null
  customerInsurance: {
    company: string | null; phone: string | null; email: string | null
    estimator: string | null; officer: string | null; caseNumber: string | null
  } | null
  thirdPartyInsurance: {
    company: string | null; phone: string | null; email: string | null
    estimator: string | null; officer: string | null; caseNumber: string | null
  } | null
  internal: {
    estimateNumber: string | null; invoiceNumber: string | null
    sentForPaymentDate: Date | string | null; paymentDetails: string | null
  } | null
}

function DetailRow({ label, labelGr, value }: { label: string; labelGr: string; value: string | null | undefined }) {
  return (
    <div className="py-2.5 px-4 border-b border-gray-50 last:border-b-0 flex items-start justify-between gap-4">
      <div className="flex-shrink-0">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
        <span className="text-[11px] text-gray-300 ml-1">/ {labelGr}</span>
      </div>
      <span className="text-sm text-gray-800 text-right font-medium">{value || '—'}</span>
    </div>
  )
}

function Section({ icon: Icon, title, titleGr, children }: {
  icon: any; title: string; titleGr: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-brand-navy/5 border-b border-gray-100">
        <Icon size={14} className="text-brand-teal" />
        <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">{title}</span>
        <span className="text-xs text-gray-400 font-light">/ {titleGr}</span>
      </div>
      {children}
    </div>
  )
}

export default function CaseDetailSections({ c }: { c: CaseWithAll }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Vehicle */}
      <Section icon={Bike} title="Vehicle" titleGr="Όχημα">
        <DetailRow label="Brand" labelGr="Μάρκα" value={c.brand} />
        <DetailRow label="Model" labelGr="Μοντέλο" value={c.model} />
        <DetailRow label="Plate" labelGr="Αρ. Εγγραφής" value={c.plate} />
        <DetailRow label="Mileage" labelGr="Χιλιόμετρα" value={c.mileage ? `${c.mileage.toLocaleString()} km` : null} />
        <DetailRow label="Reg. Date" labelGr="Ημ. Εγγραφής" value={formatDate(c.vehicleRegistrationDate)} />
      </Section>

      {/* Owner */}
      <Section icon={User} title="Owner" titleGr="Ιδιοκτήτης">
        <DetailRow label="Name" labelGr="Ονομα" value={c.owner?.name} />
        <DetailRow label="Phone" labelGr="Τηλέφωνο" value={c.owner?.phone} />
        <DetailRow label="Address" labelGr="Διεύθυνση" value={c.owner?.address} />
      </Section>

      {/* Customer Insurance */}
      <Section icon={Shield} title="Customer's Insurance" titleGr="Ασφάλεια Πελάτη">
        <DetailRow label="Company" labelGr="Εταιρεία" value={c.customerInsurance?.company} />
        <DetailRow label="Phone" labelGr="Τηλέφωνο" value={c.customerInsurance?.phone} />
        <DetailRow label="Email" labelGr="Email" value={c.customerInsurance?.email} />
        <DetailRow label="Estimator" labelGr="Εκτιμητής" value={c.customerInsurance?.estimator} />
        <DetailRow label="Officer" labelGr="Λειτουργός" value={c.customerInsurance?.officer} />
        <DetailRow label="Case #" labelGr="Αρ. Υπόθεσης" value={c.customerInsurance?.caseNumber} />
      </Section>

      {/* Third Party Insurance */}
      <Section icon={Building2} title="Third Party Insurance" titleGr="Ασφάλεια Τρίτου">
        <DetailRow label="Company" labelGr="Εταιρεία" value={c.thirdPartyInsurance?.company} />
        <DetailRow label="Phone" labelGr="Τηλέφωνο" value={c.thirdPartyInsurance?.phone} />
        <DetailRow label="Email" labelGr="Email" value={c.thirdPartyInsurance?.email} />
        <DetailRow label="Estimator" labelGr="Εκτιμητής" value={c.thirdPartyInsurance?.estimator} />
        <DetailRow label="Officer" labelGr="Λειτουργός" value={c.thirdPartyInsurance?.officer} />
        <DetailRow label="Case #" labelGr="Αρ. Υπόθεσης" value={c.thirdPartyInsurance?.caseNumber} />
      </Section>

      {/* Internal + Notes spanning full width */}
      <div className="col-span-2">
        <Section icon={FileText} title="Internal Data" titleGr="Εσωτερική Χρήση">
          <div className="grid grid-cols-2">
            <div className="border-r border-gray-50">
              <DetailRow label="Estimate #" labelGr="Αρ. Εκτίμησης" value={c.internal?.estimateNumber} />
              <DetailRow label="Invoice #" labelGr="Αρ. Τιμολογίου" value={c.internal?.invoiceNumber} />
              <DetailRow label="Sent for Payment" labelGr="Ημ. Αποστολής" value={formatDate(c.internal?.sentForPaymentDate)} />
            </div>
            <div>
              <div className="py-2.5 px-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Payment Details / Λεπτομέρειες Πληρωμής
                </p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {c.internal?.paymentDetails || '—'}
                </p>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {c.notes && (
        <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Notes / Σημειώσεις</p>
          <p className="text-sm text-amber-900 whitespace-pre-wrap">{c.notes}</p>
        </div>
      )}
    </div>
  )
}
