'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function DonationPageCopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e3dfd5] bg-white text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors"
      aria-label="Kopieer link"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[#4a7c10]" strokeWidth={2} />
      ) : (
        <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
      )}
    </button>
  )
}
