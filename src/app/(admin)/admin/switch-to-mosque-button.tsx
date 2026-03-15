'use client'

import { Landmark } from 'lucide-react'

export function SwitchToMosqueButton({ mosqueName }: { mosqueName?: string }) {
  async function handleSwitch() {
    await fetch('/api/switch-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'mosque' }),
    })
    window.location.href = '/dashboard'
  }

  return (
    <button
      onClick={handleSwitch}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3dfd5] bg-white px-3 py-1.5 text-[13px] font-medium text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors"
      title={mosqueName ? `Ga naar ${mosqueName}` : 'Ga naar moskee'}
    >
      <Landmark className="h-3.5 w-3.5" strokeWidth={1.5} />
      {mosqueName || 'Moskee weergave'}
    </button>
  )
}
