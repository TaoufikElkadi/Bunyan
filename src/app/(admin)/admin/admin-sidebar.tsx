'use client'

import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  ChevronDown,
  Landmark,
  LayoutDashboard,
  LogOut,
  Shield,
} from 'lucide-react'
import { useState } from 'react'

interface AdminSidebarProps {
  userEmail: string
  mosqueName?: string
  hasMosqueProfile: boolean
}

const NAV_ITEMS = [
  {
    label: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
  },
]

export function AdminSidebar({ userEmail, mosqueName, hasMosqueProfile }: AdminSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [accountOpen, setAccountOpen] = useState(false)

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
    <aside className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r border-[#e3dfd5] bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
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

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#b5b0a5]">
          Platform
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-[#f3f1ec] text-[#261b07]'
                  : 'text-[#8a8478] hover:bg-[#faf9f7] hover:text-[#261b07]'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Account section */}
      <div className="border-t border-[#e3dfd5] p-3">
        <div className="relative">
          <button
            onClick={() => setAccountOpen(!accountOpen)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[#faf9f7]"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#261b07] text-[11px] font-semibold text-white">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[#261b07] truncate">
                Platform Admin
              </p>
              <p className="text-[11px] text-[#a09888] truncate">{userEmail}</p>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[#a09888] transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
          </button>

          {accountOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-[#e3dfd5] bg-white py-1 shadow-lg shadow-black/[0.08]">
              {hasMosqueProfile && (
                <button
                  onClick={handleSwitchToMosque}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#8a8478] hover:bg-[#faf9f7] hover:text-[#261b07] transition-colors"
                >
                  <Landmark className="h-3.5 w-3.5" />
                  {mosqueName || 'Moskee weergave'}
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#8a8478] hover:bg-[#faf9f7] hover:text-[#261b07] transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Uitloggen
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
