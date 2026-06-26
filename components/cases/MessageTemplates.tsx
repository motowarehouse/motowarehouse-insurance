'use client'

import { useState } from 'react'
import { MessageSquare, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'

interface CaseSnapshot {
  plate: string
  model: string
  ownerName?: string | null
  custCompany?: string | null
  custOfficer?: string | null
  custCaseNumber?: string | null
  custEstimator?: string | null
  tpCompany?: string | null
  tpOfficer?: string | null
  tpCaseNumber?: string | null
  tpEstimator?: string | null
}

const buildTemplates = (c: CaseSnapshot) => [
  {
    id: 'auth',
    label: 'Εξουσιοδότηση Πελάτη',
    body: `Καλημέρα ${c.custOfficer || '[Λειτουργός]'},\n\nΕπικοινωνώ σε σχέση με το όχημα με αρ. εγγραφής ${c.plate} (${c.model}).\n\nΘα θέλαμε να ζητήσουμε την εξουσιοδότηση του πελάτη για επισκευή βάσει της εκτίμησης που έχει ετοιμαστεί.\n\nΟ αριθμός υπόθεσης σας είναι: ${c.custCaseNumber || '[Αρ. Υπόθεσης]'}\n\nΠαρακαλώ επικοινωνήστε μαζί μας για να προχωρήσουμε.\n\nΕυχαριστώ,\nMotowarehouse Ltd`,
  },
  {
    id: 'estimator_ready',
    label: 'Εκτιμητής – Ετοιμασία Εκτίμησης',
    body: `Καλημέρα ${c.custEstimator || '[Εκτιμητής]'},\n\nΤο όχημα ${c.plate} (${c.model}) είναι έτοιμο για εκτίμηση στο συνεργείο μας.\n\nΠαρακαλώ επικοινωνήστε μαζί μας για να κλείσουμε ένα ραντεβού.\n\nΕυχαριστώ,\nMotowarehouse Ltd`,
  },
  {
    id: 'tp_notify',
    label: 'Γνωστοποίηση Τρίτου',
    body: `Καλημέρα ${c.tpOfficer || '[Λειτουργός Τρίτου]'},\n\nΣε σχέση με το ατύχημα που αφορά το όχημα με αρ. εγγραφής ${c.plate} (${c.model}):\n\nΑσφαλιστική εταιρεία τρίτου: ${c.tpCompany || '[Εταιρεία]'}\nΑρ. Υπόθεσης: ${c.tpCaseNumber || '[Αρ. Υπόθεσης]'}\n\nΠαρακαλώ επικοινωνήστε μαζί μας το συντομότερο δυνατό.\n\nΕυχαριστώ,\nMotowarehouse Ltd`,
  },
  {
    id: 'payment_chase',
    label: 'Αίτημα Πληρωμής',
    body: `Καλημέρα ${c.custOfficer || '[Λειτουργός]'},\n\nΣε σχέση με το όχημα ${c.plate} (${c.model}), αρ. υπόθεσης ${c.custCaseNumber || '[Αρ. Υπόθεσης]'}:\n\nΗ επισκευή έχει ολοκληρωθεί και το τιμολόγιο έχει αποσταλεί. Παρακαλώ ενημερώστε μας για την εξέλιξη της πληρωμής.\n\nΕυχαριστώ,\nMotowarehouse Ltd`,
  },
]

interface Props {
  caseData: CaseSnapshot
}

export default function MessageTemplates({ caseData }: Props) {
  const templates = buildTemplates(caseData)
  const [openId, setOpenId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editedBodies, setEditedBodies] = useState<Record<string, string>>({})

  function toggle(id: string) {
    setOpenId(prev => prev === id ? null : id)
  }

  function getBody(t: { id: string; body: string }) {
    return editedBodies[t.id] ?? t.body
  }

  async function copy(t: { id: string; body: string }) {
    await navigator.clipboard.writeText(getBody(t))
    setCopiedId(t.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-brand-navy">
        <MessageSquare size={14} className="text-brand-teal" />
        <span className="text-white font-bold text-sm tracking-wide">Message Templates</span>
        <span className="text-brand-teal/60 font-light text-xs ml-1">/ Πρότυπα Μηνυμάτων</span>
      </div>
      <div className="divide-y divide-gray-50">
        {templates.map(t => (
          <div key={t.id}>
            <button
              onClick={() => toggle(t.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-sm font-semibold text-brand-navy">{t.label}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={e => { e.stopPropagation(); copy(t) }}
                  className="flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:text-brand-navy transition-colors px-2 py-1 rounded"
                >
                  {copiedId === t.id ? (
                    <><Check size={12} className="text-green-500" /><span className="text-green-500">Copied!</span></>
                  ) : (
                    <><Copy size={12} /> Copy</>
                  )}
                </button>
                {openId === t.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </div>
            </button>
            {openId === t.id && (
              <div className="px-4 pb-4">
                <textarea
                  value={getBody(t)}
                  onChange={e => setEditedBodies(prev => ({ ...prev, [t.id]: e.target.value }))}
                  rows={10}
                  className="input-base resize-y text-sm font-mono w-full"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => copy(t)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-teal hover:bg-brand-navy text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    {copiedId === t.id ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy to clipboard</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
