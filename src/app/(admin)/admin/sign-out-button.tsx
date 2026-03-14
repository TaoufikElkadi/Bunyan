'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3dfd5] bg-white px-3 py-1.5 text-[13px] font-medium text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors"
    >
      <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
      Uitloggen
    </button>
  )
}
