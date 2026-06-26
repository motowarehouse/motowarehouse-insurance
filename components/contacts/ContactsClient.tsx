'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Building2, User, Users } from 'lucide-react'

type OfficerBasic = { id: string; name: string; phone: string | null; email: string | null }
type Company = { id: string; name: string; phone: string | null; email: string | null; notes: string | null; officers: OfficerBasic[]; _count: { estimatorLinks: number } }
type Officer = { id: string; name: string; phone: string | null; email: string | null; companyId: string; company: { id: string; name: string } }
type Estimator = { id: string; name: string; phone: string | null; email: string | null; notes: string | null; companyLinks: { company: { id: string; name: string } }[] }

interface Props {
  initialCompanies: Company[]
  initialOfficers: Officer[]
  initialEstimators: Estimator[]
}

type Tab = 'companies' | 'officers' | 'estimators'

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <span className="font-bold text-brand-navy">{title}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function InputField({ label, name, type = 'text', placeholder = '', value, onChange }: {
  label: string; name: string; type?: string; placeholder?: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-base"
      />
    </div>
  )
}

export default function ContactsClient({ initialCompanies, initialOfficers, initialEstimators }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('companies')
  const [modalType, setModalType] = useState<Tab | null>(null)
  const [editItem, setEditItem] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [fName, setFName] = useState('')
  const [fPhone, setFPhone] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fNotes, setFNotes] = useState('')
  const [fCompanyId, setFCompanyId] = useState('')
  const [fCompanyIds, setFCompanyIds] = useState<string[]>([])

  const tabs = [
    { key: 'companies' as Tab, label: 'Companies', icon: Building2, count: initialCompanies.length },
    { key: 'officers' as Tab, label: 'Officers', icon: User, count: initialOfficers.length },
    { key: 'estimators' as Tab, label: 'Estimators', icon: Users, count: initialEstimators.length },
  ]

  function resetForm() {
    setFName(''); setFPhone(''); setFEmail(''); setFNotes(''); setFCompanyId(''); setFCompanyIds([])
  }

  function openAdd(t: Tab) {
    setEditItem(null)
    resetForm()
    setError('')
    setModalType(t)
  }

  function openEdit(t: Tab, item: any) {
    setEditItem(item)
    setError('')
    setFName(item.name || '')
    setFPhone(item.phone || '')
    setFEmail(item.email || '')
    setFNotes(item.notes || '')
    setFCompanyId(item.companyId || '')
    setFCompanyIds(t === 'estimators' ? item.companyLinks.map((l: any) => l.company.id) : [])
    setModalType(t)
  }

  async function handleDelete(t: Tab, id: string) {
    if (!confirm('Delete this entry? This cannot be undone.')) return
    const path = t === 'companies' ? 'companies' : t === 'officers' ? 'officers' : 'estimators'
    await fetch(`/api/contacts/${path}/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  async function handleSave() {
    if (!modalType) return
    setSaving(true)
    setError('')

    const path = modalType === 'companies' ? 'companies' : modalType === 'officers' ? 'officers' : 'estimators'
    const url = editItem ? `/api/contacts/${path}/${editItem.id}` : `/api/contacts/${path}`
    const method = editItem ? 'PUT' : 'POST'

    let body: any = { name: fName, phone: fPhone || null, email: fEmail || null }
    if (modalType === 'companies') body.notes = fNotes || null
    if (modalType === 'officers') body.companyId = fCompanyId
    if (modalType === 'estimators') { body.notes = fNotes || null; body.companyIds = fCompanyIds }

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const e = await res.json(); setError(e.error || 'Error saving'); setSaving(false); return }
      setModalType(null)
      router.refresh()
    } catch { setError('Network error') } finally { setSaving(false) }
  }

  function toggleCompanyId(id: string) {
    setFCompanyIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.key
                ? 'bg-brand-teal text-white'
                : 'bg-white text-gray-500 hover:text-brand-navy border border-gray-200'
            }`}
          >
            <t.icon size={14} />
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">
            {tab === 'companies' ? 'Insurance Companies' : tab === 'officers' ? 'Officers / Handlers' : 'Estimators'}
          </span>
          <button onClick={() => openAdd(tab)} className="flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:text-brand-navy transition-colors">
            <Plus size={13} /> Add
          </button>
        </div>

        {tab === 'companies' && (
          <table className="w-full text-sm">
            <thead className="bg-brand-navy text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Phone</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2 w-16">Officers</th>
                <th className="px-4 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {initialCompanies.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No companies yet — click Add to create one</td></tr>
              )}
              {initialCompanies.map((c, i) => (
                <tr key={c.id} className={i % 2 === 1 ? 'bg-[#E6F7FA]/30' : ''}>
                  <td className="px-4 py-3 font-semibold text-brand-navy">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-center">{c.officers.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit('companies', c)} className="text-gray-300 hover:text-brand-teal transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete('companies', c.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'officers' && (
          <table className="w-full text-sm">
            <thead className="bg-brand-navy text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Company</th>
                <th className="text-left px-4 py-2">Phone</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="px-4 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {initialOfficers.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No officers yet — add companies first, then officers</td></tr>
              )}
              {initialOfficers.map((o, i) => (
                <tr key={o.id} className={i % 2 === 1 ? 'bg-[#E6F7FA]/30' : ''}>
                  <td className="px-4 py-3 font-semibold text-brand-navy">{o.name}</td>
                  <td className="px-4 py-3 text-gray-500">{o.company.name}</td>
                  <td className="px-4 py-3 text-gray-500">{o.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{o.email || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit('officers', o)} className="text-gray-300 hover:text-brand-teal transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete('officers', o.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'estimators' && (
          <table className="w-full text-sm">
            <thead className="bg-brand-navy text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Companies</th>
                <th className="text-left px-4 py-2">Phone</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="px-4 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {initialEstimators.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No estimators yet — click Add to create one</td></tr>
              )}
              {initialEstimators.map((e, i) => (
                <tr key={e.id} className={i % 2 === 1 ? 'bg-[#E6F7FA]/30' : ''}>
                  <td className="px-4 py-3 font-semibold text-brand-navy">{e.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {e.companyLinks.length > 0 ? e.companyLinks.map(l => l.company.name).join(', ') : <span className="italic text-gray-300">Independent</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{e.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{e.email || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit('estimators', e)} className="text-gray-300 hover:text-brand-teal transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete('estimators', e.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Company modal */}
      {modalType === 'companies' && (
        <Modal title={editItem ? 'Edit Company' : 'Add Company'} onClose={() => setModalType(null)}>
          <InputField label="Company Name *" name="name" placeholder="e.g. COSMOS Insurance" value={fName} onChange={setFName} />
          <InputField label="Phone" name="phone" placeholder="22 xxxxxx" value={fPhone} onChange={setFPhone} />
          <InputField label="Email" name="email" type="email" placeholder="info@company.com" value={fEmail} onChange={setFEmail} />
          <InputField label="Notes" name="notes" placeholder="Optional notes" value={fNotes} onChange={setFNotes} />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button onClick={handleSave} disabled={saving || !fName.trim()} className="w-full py-2.5 bg-brand-teal text-white font-bold rounded-lg hover:bg-brand-navy transition-colors disabled:opacity-40">
            {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Company'}
          </button>
        </Modal>
      )}

      {/* Officer modal */}
      {modalType === 'officers' && (
        <Modal title={editItem ? 'Edit Officer' : 'Add Officer'} onClose={() => setModalType(null)}>
          <InputField label="Full Name *" name="name" placeholder="e.g. Ειρήνη Παπαδοπούλου" value={fName} onChange={setFName} />
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Company *</label>
            <select value={fCompanyId} onChange={e => setFCompanyId(e.target.value)} className="input-base">
              <option value="">Select company…</option>
              {initialCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <InputField label="Phone" name="phone" placeholder="99 xxxxxx" value={fPhone} onChange={setFPhone} />
          <InputField label="Email" name="email" type="email" placeholder="officer@company.com" value={fEmail} onChange={setFEmail} />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button onClick={handleSave} disabled={saving || !fName.trim() || !fCompanyId} className="w-full py-2.5 bg-brand-teal text-white font-bold rounded-lg hover:bg-brand-navy transition-colors disabled:opacity-40">
            {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Officer'}
          </button>
        </Modal>
      )}

      {/* Estimator modal */}
      {modalType === 'estimators' && (
        <Modal title={editItem ? 'Edit Estimator' : 'Add Estimator'} onClose={() => setModalType(null)}>
          <InputField label="Full Name *" name="name" placeholder="e.g. Κωνσταντίνος Τελεβάντος" value={fName} onChange={setFName} />
          <InputField label="Phone" name="phone" placeholder="99 xxxxxx" value={fPhone} onChange={setFPhone} />
          <InputField label="Email" name="email" type="email" placeholder="estimator@email.com" value={fEmail} onChange={setFEmail} />
          {initialCompanies.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Linked Companies (optional)</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {initialCompanies.map(c => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={fCompanyIds.includes(c.id)}
                      onChange={() => toggleCompanyId(c.id)}
                      className="accent-brand-teal"
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <InputField label="Notes" name="notes" placeholder="Optional notes" value={fNotes} onChange={setFNotes} />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button onClick={handleSave} disabled={saving || !fName.trim()} className="w-full py-2.5 bg-brand-teal text-white font-bold rounded-lg hover:bg-brand-navy transition-colors disabled:opacity-40">
            {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Estimator'}
          </button>
        </Modal>
      )}
    </div>
  )
}
