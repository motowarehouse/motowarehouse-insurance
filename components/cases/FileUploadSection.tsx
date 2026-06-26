'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, FileText, Image, Loader2, ExternalLink } from 'lucide-react'
import { formatFileSize, isImage } from '@/lib/utils'
import { formatRelative } from '@/lib/utils'

interface CaseFile {
  id: string
  url: string
  name: string
  mimeType: string
  size: number | null
  uploadedAt: Date | string
}

interface FileUploadSectionProps {
  caseId: string
  files: CaseFile[]
}

export default function FileUploadSection({ caseId, files }: FileUploadSectionProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      // 1. Get pre-signed URL from our API
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      })

      if (!res.ok) throw new Error('Failed to get upload URL')
      const { uploadUrl } = await res.json()

      // 2. Upload directly to R2
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
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">
          Files & Photos / Αρχεία &amp; Φωτογραφίες
        </span>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 text-xs font-semibold text-brand-teal hover:text-brand-navy
                     border border-brand-teal/30 hover:border-brand-teal px-3 py-1.5 rounded-lg
                     transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {uploading ? 'Uploading…' : 'Upload File'}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf"
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
          {error}
        </div>
      )}

      {files.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center py-10 text-gray-300
                     cursor-pointer hover:text-brand-teal transition-colors"
        >
          <Upload size={28} className="mb-2" />
          <p className="text-sm font-medium">Click to upload images or PDFs</p>
          <p className="text-xs mt-1">Max file size: 25 MB</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {files.map(file => (
            <div key={file.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                {isImage(file.mimeType) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.url} alt={file.name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <FileText size={18} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(file.size)} · {formatRelative(file.uploadedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-brand-teal"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => handleDelete(file.id)}
                  disabled={deletingId === file.id}
                  className="text-gray-400 hover:text-red-500"
                >
                  {deletingId === file.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
