'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Menu, Shield, Landmark, LogOut } from 'lucide-react'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

interface AdminMobileHeaderProps {
  userEmail: string
  mosqueName?: string
  hasMosqueProfile: boolean
}

export function AdminMobileHeader({ userEmail, mosqueName, hasMosqueProfile }: AdminMobileHeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleSwitchToMosque() {
    await fetch('/api/switch-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'mosque' }),
    })
    window.location.href = '/dashboard'
  }

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e3dfd5] bg-white px-4 py-3 md:hidden">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#345e7d] shadow-sm overflow-hidden">
          <Image src="/logos/logo_transparent.svg" alt="Bunyan" width={24} height={24} className="h-6 w-6" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold tracking-tight text-[#261b07]">Bunyan</span>
          <span className="inline-flex items-center gap-0.5 rounded-md bg-[#f9a600]/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#8a6d00]">
            <Shield className="h-2.5 w-2.5" />
            Admin
          </span>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8a8478] hover:bg-[#f3f1ec] transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          }
        />
        <SheetContent side="right" showCloseButton={false} className="w-[280px] p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#e3dfd5]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#261b07] text-[11px] font-semibold text-white">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[#261b07] truncate">Platform Admin</p>
                <p className="text-[12px] text-[#a09888] truncate">{userEmail}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex-1 p-3 space-y-1">
              {hasMosqueProfile && (
                <button
                  onClick={() => { setOpen(false); handleSwitchToMosque() }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[#8a8478] hover:bg-[#faf9f7] hover:text-[#261b07] transition-colors"
                >
                  <Landmark className="h-4 w-4" />
                  {mosqueName || 'Moskee weergave'}
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#e3dfd5] p-3">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[#8a8478] hover:bg-[#faf9f7] hover:text-[#261b07] transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Uitloggen
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
