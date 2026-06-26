import CaseForm from '@/components/cases/CaseForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewCasePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand-teal transition-colors"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-brand-navy">New Insurance Case</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          ΚΑΡΤΕΛΑ ΜΟΤΟ ΑΠΌ ΑΤΥΧΗΜΑ — Fill in all available information
        </p>
      </div>

      <CaseForm />
    </div>
  )
}
