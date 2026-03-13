'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney } from '@/lib/money'

type Props = {
  amount: number
  frequency: string
  fundName: string
  mosqueName: string
  cancelToken: string
}

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Wekelijks',
  monthly: 'Maandelijks',
  yearly: 'Jaarlijks',
}

export function CancelForm({ amount, frequency, fundName, mosqueName, cancelToken }: Props) {
  const [status, setStatus] = useState<'idle' | 'confirming' | 'loading' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    setStatus('loading')
    setError(null)

    try {
      const res = await fetch('/api/recurring/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel_token: cancelToken }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Er is iets misgegaan')
      }

      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
      setStatus('confirming')
    }
  }

  if (status === 'done') {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-4xl mb-4">&#10003;</div>
          <h2 className="text-xl font-semibold mb-2">Donatie geannuleerd</h2>
          <p className="text-muted-foreground">
            Uw terugkerende donatie van {formatMoney(amount)} {FREQUENCY_LABELS[frequency]?.toLowerCase()} aan {mosqueName} is geannuleerd.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Terugkerende donatie annuleren</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Moskee</span>
            <span className="font-medium">{mosqueName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fonds</span>
            <span className="font-medium">{fundName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bedrag</span>
            <span className="font-medium">{formatMoney(amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frequentie</span>
            <span className="font-medium">{FREQUENCY_LABELS[frequency] || frequency}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {status === 'confirming' && !error && (
          <p className="text-sm text-amber-600">
            Weet u zeker dat u deze donatie wilt annuleren? Dit kan niet ongedaan worden gemaakt.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {status === 'idle' && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setStatus('confirming')}
          >
            Annuleer mijn donatie
          </Button>
        )}
        {status === 'confirming' && (
          <>
            <Button variant="ghost" onClick={() => setStatus('idle')}>
              Terug
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCancel}
            >
              Ja, annuleer definitief
            </Button>
          </>
        )}
        {status === 'loading' && (
          <Button variant="destructive" className="w-full" disabled>
            Bezig met annuleren...
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
