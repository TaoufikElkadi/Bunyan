'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Er is iets misgegaan
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Er is een onverwachte fout opgetreden. Probeer het opnieuw.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex h-9 items-center rounded-lg bg-[#261b07] px-4 text-sm font-medium text-white transition-colors hover:bg-[#3a2a10]"
        >
          Opnieuw proberen
        </button>
      </div>
    </div>
  )
}
