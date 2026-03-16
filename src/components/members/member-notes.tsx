'use client'

import { useState, useCallback } from 'react'

export function MemberNotes({ donorId, initialNotes }: { donorId: string; initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = useCallback(async () => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/members/${donorId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }, [donorId, notes])

  return (
    <div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={save}
        placeholder="Interne notities (alleen zichtbaar voor het bestuur)..."
        className="w-full h-24 rounded-lg border border-[#e3dfd5] bg-[#fafaf8] px-3 py-2 text-[13px] text-[#261b07] placeholder:text-[#b5b0a5] focus:outline-none focus:ring-2 focus:ring-[#C87D3A]/30 focus:border-[#C87D3A] resize-none"
      />
      <div className="flex justify-end mt-1.5 h-4">
        {saving && <span className="text-[11px] text-[#a09888]">Opslaan...</span>}
        {saved && <span className="text-[11px] text-[#4a7c10]">Opgeslagen</span>}
      </div>
    </div>
  )
}
