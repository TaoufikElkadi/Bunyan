import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/settings-client'

export default async function InstellingenPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*, mosques(*)')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const mosque = profile.mosques as any
  const hasStripeKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Instellingen</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Beheer de instellingen en voorkeuren van uw moskee
        </p>
      </div>

      <SettingsClient
        mosque={mosque}
        userId={profile.id}
        userRole={profile.role}
        hasStripeKey={hasStripeKey}
      />
    </div>
  )
}
