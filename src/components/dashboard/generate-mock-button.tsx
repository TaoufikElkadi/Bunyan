'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSWRConfig } from 'swr'
import { FlaskConical, Loader2, Trash2 } from 'lucide-react'

export function GenerateMockButton() {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const router = useRouter()
  const { mutate } = useSWRConfig()

  function revalidateAll() {
    // Refresh server components
    router.refresh()
    // Invalidate all SWR caches (member stats, tax opportunity, etc.)
    mutate(() => true, undefined, { revalidate: true })
  }

  async function handleGenerate() {
    setLoading(true)
    setResult(null)

    const res = await fetch('/api/mock-data', { method: 'POST' })
    const data = await res.json()

    if (res.ok) {
      setResult(`${data.created.donors} donateurs, ${data.created.donations} donaties, ${data.created.recurrings} terugkerend`)
      revalidateAll()
    } else {
      setResult(data.error ?? 'Er ging iets mis')
    }
    setLoading(false)
  }

  async function handleDelete() {
    setDeleting(true)
    setResult(null)

    const res = await fetch('/api/mock-data', { method: 'DELETE' })

    if (res.ok) {
      setResult('Mock data verwijderd')
      revalidateAll()
    } else {
      const data = await res.json()
      setResult(data.error ?? 'Er ging iets mis')
    }
    setDeleting(false)
  }

  return (
    <div className="rounded-2xl border border-dashed border-[#e3dfd5] bg-[#fafaf8] p-4">
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical className="h-4 w-4 text-[#a09888]" strokeWidth={1.5} />
        <p className="text-[12px] font-semibold text-[#8a8478] uppercase tracking-wide">Testdata</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleGenerate}
          disabled={loading || deleting}
          className="flex items-center gap-2 rounded-xl bg-[#261b07] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#3a2c14] disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
          Genereer mockdata
        </button>
        <button
          onClick={handleDelete}
          disabled={loading || deleting}
          className="flex items-center gap-2 rounded-xl border border-[#e3dfd5] px-4 py-2 text-[12px] font-medium text-[#8a8478] hover:bg-white hover:text-red-500 hover:border-red-200 disabled:opacity-50 transition-colors"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Verwijder
        </button>
      </div>
      {result && (
        <p className="mt-2 text-[11px] text-[#8a8478]">{result}</p>
      )}
    </div>
  )
}
