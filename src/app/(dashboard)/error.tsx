'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#f8f7f5] px-6">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f1ec]">
          <svg
            className="h-6 w-6 text-[#a09888]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h2 className="text-[15px] font-semibold text-[#261b07]">
          Er is iets misgegaan
        </h2>
        <p className="mt-1.5 text-[13px] text-[#a09888] max-w-xs mx-auto leading-relaxed">
          Er is een onverwachte fout opgetreden bij het laden van deze pagina.
        </p>
        <button
          onClick={reset}
          className="mt-5 inline-flex h-9 items-center rounded-lg bg-[#261b07] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#3a2a10]"
        >
          Opnieuw proberen
        </button>
      </div>
    </div>
  )
}
