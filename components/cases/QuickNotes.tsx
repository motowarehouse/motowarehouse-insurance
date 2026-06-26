'use client'

import { useState, useEffect } from 'react'
import { StickyNote, Plus, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Note {
  id: string
  content: string
  createdAt: string
}

interface Props {
  caseId: string
}

export default function QuickNotes({ caseId }: Props) {
  const [notes, setNotes] = useState<Note[]>([])
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/cases/${caseId}/notes`)
      .then(r => r.ok ? r.json() : [])
      .then(setNotes)
      .catch(() => {})
  }, [caseId])

  async function addNote() {
    if (!text.trim()) return
    setSaving(true)
    const res = await fetch(`/api/cases/${caseId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text.trim() }),
    })
    if (res.ok) {
      const note = await res.json()
      setNotes(prev => [note, ...prev])
      setText('')
    }
    setSaving(false)
  }

  async function deleteNote(noteId: string) {
    if (!confirm('Delete this note?')) return
    await fetch(`/api/cases/${caseId}/notes?noteId=${noteId}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-brand-navy">
        <StickyNote size={14} className="text-brand-teal" />
        <span className="text-white font-bold text-sm tracking-wide">Quick Notes</span>
        <span className="text-brand-teal/60 font-light text-xs ml-1">/ Σημειώσεις</span>
      </div>
      <div className="p-4 space-y-3">
        {/* Input */}
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote() }}
            rows={2}
            placeholder="Add a quick note… (Ctrl+Enter to save)"
            className="input-base resize-none flex-1 text-sm"
          />
          <button
            onClick={addNote}
            disabled={saving || !text.trim()}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-teal hover:bg-brand-navy text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-40 self-start mt-0.5"
          >
            <Plus size={13} />
            {saving ? 'Saving…' : 'Add'}
          </button>
        </div>

        {/* Notes list */}
        {notes.length === 0 && (
          <p className="text-center text-gray-300 text-sm py-4">No notes yet</p>
        )}
        <div className="space-y-2">
          {notes.map(note => (
            <div key={note.id} className="group flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(note.createdAt)}</p>
              </div>
              <button
                onClick={() => deleteNote(note.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
