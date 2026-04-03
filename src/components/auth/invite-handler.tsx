'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Detects Supabase invite/auth tokens in the URL hash fragment and
 * establishes the session, then redirects to set-password or dashboard.
 */
export function InviteHandler() {
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    const hash = window.location.hash
    if (!hash || !hash.includes('access_token')) return

    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    if (!accessToken || !refreshToken) return

    // Status update is intentional here — shows loading state during async auth
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('Even geduld...')

    const supabase = createClient()
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setStatus(`Fout: ${error.message}`)
          return
        }
        // Hard redirect — more reliable than router.push after setSession
        const dest = type === 'invite' ? '/set-password' : '/dashboard'
        window.location.href = dest
      })
      .catch((err) => {
        setStatus(`Fout: ${err.message}`)
      })
  }, [])

  if (status) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{status}</p>
      </div>
    )
  }

  return null
}
