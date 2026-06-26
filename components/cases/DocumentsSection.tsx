'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, Loader2, ExternalLink, X, CheckCircle } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'

type DocType = 'QUOTE' | 'INVOICE' | 'DISCHARGE_RECEIPT' | 'REPAIR_COMMAND'

interface CaseFile {
  id: string
  url: string
  name: string
  mimeType: string
  size: number | null
  docType: DocType | null
  uploadedAt: Date | string
}

const DOC_TYPES: Array<{ key: DocType; label: string; labelEl: string }> = [
  { key: 'QUOTE',             label: 'Quote',             labelEl: 'Προσφορά' },
  { key: 'INVOICE',           label: 'Invoice',           labelEl: 'Τιμολόγιο' },
  { key: 'DISCHARGE_RECEIPT', label: 'Discharge Receipt', labelEl: 'Απόδειξη Αποχώρησης' },
  { key: 'REPAIR_COMMAND',    label: 'Repair Command',    labelEl: 'Εντολή Επισκευής' },
]

export default function DocumentsSection({ caseId, files }: { caseId: string; files: CaseFile[] }) {
  const router = useRouter()
  const [uploading, setUploading] = useState<DocType | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const inputRefs = useRef<Record<DocType, HTMLInputElement | null>>({
    QUOTE: null,
    INVOICE: null,
    DISCHARGE_RECEIPT: null,
    REPAIR_COMMAND: null,
  })

  const filesByType = (type: DocType) => files.filter(f => f.docType === type)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, docType: DocType) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(docType)
    setError('')

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          filename: file.name,
          contentType: file.type,
          size: file.size,
          docType,
        }),
      })

      if (!res.ok) throw new Error('Failed to get upload URL')
      const { uploadUrl } = await res.json()

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadRes.ok) throw new Error('Upload to storage failed')
      router.refresh()
    } catch (e: any) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(null)
      const ref = inputRefs.current[docType]
      if (ref) ref.value = ''
    }
  }

  async function handleDelete(fileId: string) {
    setDeletingId(fileId)
    try {
      await fetch(`/api/files/${fileId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">
          Documents / Έγγραφα
        </span>
      </div>

      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
          {error}
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {DOC_TYPES.map(({ key, label, labelEl }) => {
          const docs = filesByType(key)
          const isUploading = uploading === key

          return (
            <div key={key} className="px-4 py-3">
              {/* Row header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {docs.length > 0
                    ? <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                    : <FileText size={13} className="text-gray-300 flex-shrink-0" />
                  }
                  <span className="text-xs font-semibold text-gray-700">{label}</span>
                  <span className="text-xs text-gray-400">/ {labelEl}</span>
                </div>
                <button
                  onClick={() => inputRefs.current[key]?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand-teal
                             hover:text-brand-navy border border-brand-teal/30 hover:border-brand-teal
                             px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isUploading
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Upload size={11} />
                  }
                  {isUploading ? 'Uploading…' : docs.length > 0 ? 'Replace' : 'Upload'}
                </button>
                <input
                  ref={el => { inputRefs.current[key] = el }}
                  type="file"
                  className="hidden"
                  accept=".pdf,application/pdf"
                  onChange={e => handleUpload(e, key)}
                />
              </div>

              {/* Files */}
              {docs.length === 0 ? (
                <p className="text-xs text-gray-300 mt-1.5 pl-5">No document uploaded</p>
              ) : (
                <div className="mt-1.5 space-y-1 pl-5">
                  {docs.map(f => (
                    <div key={f.id} className="flex items-center gap-2 group">
                      <FileText size={12} className="text-brand-teal flex-shrink-0" />
                      <span className="text-xs text-gray-600 truncate flex-1">{f.name}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(f.size)}</span>
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-brand-teal opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink size={12} />
                      </a>
                      <button
                        onClick={() => handleDelete(f.id)}
                        disabled={deletingId === f.id}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {deletingId === f.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <X size={12} />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
