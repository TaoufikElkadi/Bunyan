'use client'

import { useState } from 'react'
import { Alert, AlertTitle, AlertDescription, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'

interface UpgradeBannerProps {
  message: string
  plan: string
}

const DISMISS_KEY = 'bunyan_upgrade_banner_dismissed'

export function UpgradeBanner({ message, plan }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(DISMISS_KEY) === 'true'
  })

  if (plan !== 'free' || dismissed) return null

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  return (
    <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
      <AlertTitle>Upgrade uw abonnement</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      <AlertAction>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-amber-900 hover:text-amber-700 dark:text-amber-200 dark:hover:text-amber-100"
          onClick={handleDismiss}
        >
          <XIcon className="size-4" />
          <span className="sr-only">Sluiten</span>
        </Button>
      </AlertAction>
    </Alert>
  )
}
