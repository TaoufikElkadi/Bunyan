'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

interface DashboardHeaderProps {
  user: { name: string; role: string }
  mosque: { name: string }
}

export function DashboardHeader({ user, mosque }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex-1">
        <h2 className="text-sm font-medium">{mosque.name}</h2>
      </div>
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        Uitloggen
      </Button>
    </header>
  )
}
