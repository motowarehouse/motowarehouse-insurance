'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Bike, User, Shield, Building2, FileText, Save, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

const CaseSchema = z.object({
  plate: z.string().min(1, 'Plate is required'),
  entryDate: z.string().min(1, 'Entry date is required'),
  brand: z.enum(['SYM', 'CFMOTO', 'OTHER']),
  model: z.string().min(1, 'Model is required'),
  mileage: z.string().optional(),
  vehicleRegistrationDate: z.string().optional(),
  notes: z.string().optional(),
  ownerName: z.string().optional(),
  ownerAddress: z.string().optional(),
  ownerPhone: z.string().optional(),
  custCompany: z.string().optional(),
  custPhone: z.string().optional(),
  custEmail: z.string().optional(),
  custEstimator: z.string().optional(),
  custOfficer: z.string().optional(),
  custCaseNumber: z.string().optional(),
  tpCompany: z.string().optional(),
  tpPhone: z.string().optional(),
  tpEmail: z.string().optional(),
  tpEstimator: z.string().optional(),
  tpOfficer: z.string().optional(),
  tpCaseNumber: z.string().optional(),
  estimateNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
  sentForPaymentDate: z.string().optional(),
  paymentDetails: z.string().optional(),
})

type CaseFormData = z.infer<typeof CaseSchema>

interface CaseFormProps {
  defaultValues?: Partial<CaseFormData>
  caseId?: string
  isEdit?: boolean
}

type OfficerBasic = { id: string; name: string; phone: string | null; email: string | null }
type Company = { id: string; name: string; phone: string | null; email: string | null; officers: OfficerBasic[] }
type EstimatorBasic = { id: string; name: string }

function SectionHeader({ icon: Icon, title, titleGr }: { icon: any; title: string; titleGr: string }) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-brand-navy rounded-t-xl">
      <Icon size={15} className="text-brand-teal" />
      <div>
        <span className="text-white font-bold text-sm tracking-wide">{title}</span>
        <span className="text-brand-teal/60 font-light text-xs ml-2">/ {titleGr}</span>
      </div>
    </div>
  )
}

function FieldLabel({ label, labelGr }: { label: string; labelGr: string }) {
  return (
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
      {label} <span className="text-gray-400 font-light normal-case tracking-normal">/ {labelGr}</span>
    </label>
  )
}

export default function CaseForm({ defaultValues, caseId, isEdit = false }: CaseFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [companies, setCompanies] = useState<Company[]>([])
  const [estimators, setEstimators] = useState<EstimatorBasic[]>([])
  const [selectedCustCompanyId, setSelectedCustCompanyId] = useState('')
  const [selectedTpCompanyId, setSelectedTpCompanyId] = useState('')
  const [custOfficerId, setCustOfficerId] = useState('')
  const [tpOfficerId, setTpOfficerId] = useState('')
  const [custEstimatorId, setCustEstimatorId] = useState('')
  const [tpEstimatorId, setTpEstimatorId] = useState('')

  useEffect(() => {
    fetch('/api/contacts/companies')
      .then(r => r.ok ? r.json() : [])
      .then(setCompanies)
      .catch(() => {})
    fetch('/api/contacts/estimators')
      .then(r => r.ok ? r.json() : [])
      .then(setEstimators)
      .catch(() => {})
  }, [])

  const custOfficers = companies.find(c => c.id === selectedCustCompanyId)?.officers || []
  const tpOfficers = companies.find(c => c.id === selectedTpCompanyId)?.officers || []

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CaseFormData>({
    resolver: zodResolver(CaseSchema),
    defaultValues: {
      entryDate: format(new Date(), 'yyyy-MM-dd'),
      brand: 'SYM',
      ...defaultValues,
    },
  })

  function handleCustCompanySelect(companyId: string) {
    setSelectedCustCompanyId(companyId)
    setCustOfficerId('')
    const co = companies.find(c => c.id === companyId)
    if (co) {
      setValue('custCompany', co.name)
      if (co.phone) setValue('custPhone', co.phone)
      if (co.email) setValue('custEmail', co.email)
    }
  }

  function handleCustOfficerSelect(officerId: string) {
    setCustOfficerId(officerId)
    const o = custOfficers.find(x => x.id === officerId)
    if (o) {
      setValue('custOfficer', o.name)
      if (o.phone) setValue('custPhone', o.phone)
      if (o.email) setValue('custEmail', o.email)
    }
  }

  function handleTpCompanySelect(companyId: string) {
    setSelectedTpCompanyId(companyId)
    setTpOfficerId('')
    const co = companies.find(c => c.id === companyId)
    if (co) {
      setValue('tpCompany', co.name)
      if (co.phone) setValue('tpPhone', co.phone)
      if (co.email) setValue('tpEmail', co.email)
    }
  }

  function handleTpOfficerSelect(officerId: string) {
    setTpOfficerId(officerId)
    const o = tpOfficers.find(x => x.id === officerId)
    if (o) {
      setValue('tpOfficer', o.name)
      if (o.phone) setValue('tpPhone', o.phone)
      if (o.email) setValue('tpEmail', o.email)
    }
  }

  function handleCustEstimatorSelect(estimatorId: string) {
    setCustEstimatorId(estimatorId)
    const e = estimators.find(x => x.id === estimatorId)
    if (e) setValue('custEstimator', e.name)
  }

  function handleTpEstimatorSelect(estimatorId: string) {
    setTpEstimatorId(estimatorId)
    const e = estimators.find(x => x.id === estimatorId)
    if (e) setValue('tpEstimator', e.name)
  }

  async function onSubmit(data: CaseFormData) {
    setSubmitting(true)
    setError('')

    const payload = {
      plate: data.plate,
      entryDate: data.entryDate,
      brand: data.brand,
      model: data.model,
      mileage: data.mileage ? parseInt(data.mileage) : null,
      vehicleRegistrationDate: data.vehicleRegistrationDate || null,
      notes: data.notes || null,
      owner: {
        name: data.ownerName || null,
        address: data.ownerAddress || null,
        phone: data.ownerPhone || null,
      },
      customerInsurance: {
        company: data.custCompany || null,
        phone: data.custPhone || null,
        email: data.custEmail || null,
        estimator: data.custEstimator || null,
        officer: data.custOfficer || null,
        caseNumber: data.custCaseNumber || null,
        companyId: selectedCustCompanyId || null,
        officerId: custOfficerId || null,
        estimatorId: custEstimatorId || null,
      },
      thirdPartyInsurance: {
        company: data.tpCompany || null,
        phone: data.tpPhone || null,
        email: data.tpEmail || null,
        estimator: data.tpEstimator || null,
        officer: data.tpOfficer || null,
        caseNumber: data.tpCaseNumber || null,
        companyId: selectedTpCompanyId || null,
        officerId: tpOfficerId || null,
        estimatorId: tpEstimatorId || null,
      },
      internal: {
        estimateNumber: data.estimateNumber || null,
        invoiceNumber: data.invoiceNumber || null,
        sentForPaymentDate: data.sentForPaymentDate || null,
        paymentDetails: data.paymentDetails || null,
      },
    }

    try {
      const url = isEdit ? `/api/cases/${caseId}` : '/api/cases'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Something went wrong.')
        setSubmitting(false)
        return
      }
      const saved = await res.json()
      router.push(`/cases/${saved.id}`)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  const quickSelectClass = 'input-base bg-brand-teal/5 border-brand-teal/30 text-sm'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
      )}

      {/* Vehicle */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader icon={Bike} title="Vehicle Details" titleGr="Στοιχεία Οχήματος" />
        <div className="p-5 grid grid-cols-3 gap-4">
          <div>
            <FieldLabel label="Registration Plate" labelGr="Αρ. Εγγραφής" />
            <input {...register('plate')} className="input-base uppercase" placeholder="e.g. TEA558" />
            {errors.plate && <p className="text-red-500 text-xs mt-1">{errors.plate.message}</p>}
          </div>
          <div>
            <FieldLabel label="Brand" labelGr="Μάρκα" />
            <select {...register('brand')} className="input-base">
              <option value="SYM">SYM</option>
              <option value="CFMOTO">CFMOTO</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <FieldLabel label="Model" labelGr="Μοντέλο" />
            <input {...register('model')} className="input-base" placeholder="e.g. JET X 125" />
            {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>}
          </div>
          <div>
            <FieldLabel label="Entry Date" labelGr="Ημ. Εισαγωγής" />
            <input {...register('entryDate')} type="date" className="input-base" />
          </div>
          <div>
            <FieldLabel label="Mileage (km)" labelGr="Χιλιόμετρα" />
            <input {...register('mileage')} type="number" className="input-base" placeholder="e.g. 12500" />
          </div>
          <div>
            <FieldLabel label="Vehicle Registration Date" labelGr="Ημ. Εγγραφής Οχήματος" />
            <input {...register('vehicleRegistrationDate')} type="date" className="input-base" />
          </div>
        </div>
      </div>

      {/* Owner */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader icon={User} title="Owner Details" titleGr="Στοιχεία Ιδιοκτήτη" />
        <div className="p-5 grid grid-cols-3 gap-4">
          <div>
            <FieldLabel label="Full Name" labelGr="Ονομα" />
            <input {...register('ownerName')} className="input-base" placeholder="Owner's full name" />
          </div>
          <div>
            <FieldLabel label="Phone" labelGr="Τηλέφωνο" />
            <input {...register('ownerPhone')} className="input-base" placeholder="e.g. 99 123456" />
          </div>
          <div>
            <FieldLabel label="Address" labelGr="Διεύθυνση" />
            <input {...register('ownerAddress')} className="input-base" placeholder="Address" />
          </div>
        </div>
      </div>

      {/* Customer Insurance */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader icon={Shield} title="Customer's Insurance" titleGr="Ασφάλεια Πελάτη" />
        <div className="p-5 space-y-4">
          {companies.length > 0 && (
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-50">
              <div>
                <label className="block text-xs font-bold text-brand-teal/80 uppercase tracking-wide mb-1">Quick Select Company</label>
                <select value={selectedCustCompanyId} onChange={e => handleCustCompanySelect(e.target.value)} className={quickSelectClass}>
                  <option value="">— select from directory —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-teal/80 uppercase tracking-wide mb-1">Quick Select Officer</label>
                <select value={custOfficerId} onChange={e => handleCustOfficerSelect(e.target.value)} disabled={!selectedCustCompanyId || custOfficers.length === 0} className={quickSelectClass}>
                  <option value="">— select officer —</option>
                  {custOfficers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <FieldLabel label="Insurance Company" labelGr="Εταιρεία" />
              <input {...register('custCompany')} className="input-base" placeholder="e.g. COSMOS" />
            </div>
            <div>
              <FieldLabel label="Phone" labelGr="Τηλέφωνο" />
              <input {...register('custPhone')} className="input-base" placeholder="Insurance phone" />
            </div>
            <div>
              <FieldLabel label="Email" labelGr="Email" />
              <input {...register('custEmail')} type="email" className="input-base" placeholder="Insurance email" />
            </div>
            <div>
              <FieldLabel label="Estimator" labelGr="Εκτιμητής" />
              {estimators.length > 0 && (
                <select value={custEstimatorId} onChange={e => handleCustEstimatorSelect(e.target.value)} className={`${quickSelectClass} mb-1`}>
                  <option value="">— select or type —</option>
                  {estimators.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              )}
              <input {...register('custEstimator')} className="input-base" placeholder="Estimator name" />
            </div>
            <div>
              <FieldLabel label="Officer / Handler" labelGr="Λειτουργός" />
              <input {...register('custOfficer')} className="input-base" placeholder="Officer name" />
            </div>
            <div>
              <FieldLabel label="Case Number" labelGr="Αρ. Υπόθεσης" />
              <input {...register('custCaseNumber')} className="input-base" placeholder="Insurance case #" />
            </div>
          </div>
        </div>
      </div>

      {/* Third Party Insurance */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader icon={Building2} title="Third Party Insurance" titleGr="Ασφάλεια Τρίτου" />
        <div className="p-5 space-y-4">
          {companies.length > 0 && (
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-50">
              <div>
                <label className="block text-xs font-bold text-brand-teal/80 uppercase tracking-wide mb-1">Quick Select Company</label>
                <select value={selectedTpCompanyId} onChange={e => handleTpCompanySelect(e.target.value)} className={quickSelectClass}>
                  <option value="">— select from directory —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-teal/80 uppercase tracking-wide mb-1">Quick Select Officer</label>
                <select value={tpOfficerId} onChange={e => handleTpOfficerSelect(e.target.value)} disabled={!selectedTpCompanyId || tpOfficers.length === 0} className={quickSelectClass}>
                  <option value="">— select officer —</option>
                  {tpOfficers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <FieldLabel label="Insurance Company" labelGr="Εταιρεία" />
              <input {...register('tpCompany')} className="input-base" placeholder="e.g. ANYTIME" />
            </div>
            <div>
              <FieldLabel label="Phone" labelGr="Τηλέφωνο" />
              <input {...register('tpPhone')} className="input-base" placeholder="Insurance phone" />
            </div>
            <div>
              <FieldLabel label="Email" labelGr="Email" />
              <input {...register('tpEmail')} type="email" className="input-base" placeholder="Insurance email" />
            </div>
            <div>
              <FieldLabel label="Estimator" labelGr="Εκτιμητής" />
              {estimators.length > 0 && (
                <select value={tpEstimatorId} onChange={e => handleTpEstimatorSelect(e.target.value)} className={`${quickSelectClass} mb-1`}>
                  <option value="">— select or type —</option>
                  {estimators.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              )}
              <input {...register('tpEstimator')} className="input-base" placeholder="Estimator name" />
            </div>
            <div>
              <FieldLabel label="Officer / Handler" labelGr="Λειτουργός" />
              <input {...register('tpOfficer')} className="input-base" placeholder="Officer name" />
            </div>
            <div>
              <FieldLabel label="Case Number" labelGr="Αρ. Υπόθεσης" />
              <input {...register('tpCaseNumber')} className="input-base" placeholder="Insurance case #" />
            </div>
          </div>
        </div>
      </div>

      {/* Internal */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader icon={FileText} title="Internal Use" titleGr="Για Εσωτερική Χρήση" />
        <div className="p-5 grid grid-cols-3 gap-4">
          <div>
            <FieldLabel label="Estimate Number" labelGr="Αρ. Εκτίμησης" />
            <input {...register('estimateNumber')} className="input-base" placeholder="Estimate #" />
          </div>
          <div>
            <FieldLabel label="Invoice Number" labelGr="Αρ. Τιμολογίου" />
            <input {...register('invoiceNumber')} className="input-base" placeholder="Invoice #" />
          </div>
          <div>
            <FieldLabel label="Date Sent for Payment" labelGr="Ημ. Αποστολής" />
            <input {...register('sentForPaymentDate')} type="date" className="input-base" />
          </div>
          <div className="col-span-3">
            <FieldLabel label="Payment Details" labelGr="Λεπτομέρειες Πληρωμής" />
            <textarea {...register('paymentDetails')} className="input-base resize-none" rows={3} placeholder="Payment notes, amounts, bank details…" />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Notes / Σημειώσεις</span>
        </div>
        <div className="p-5">
          <textarea {...register('notes')} className="input-base resize-none" rows={4} placeholder="Any additional notes…" />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pb-4">
        <button type="button" onClick={() => router.back()} className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-brand-teal hover:bg-brand-navy text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50">
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Case'}
        </button>
      </div>
    </form>
  )
}
