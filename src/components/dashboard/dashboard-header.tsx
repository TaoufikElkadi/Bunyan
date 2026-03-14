'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Search, Bell, LogOut, ChevronDown, Settings } from 'lucide-react'

interface DashboardHeaderProps {
  user: { name: string; role: string }
  mosque: { name: string }
}

export function DashboardHeader({ user, mosque }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#e3dfd5] bg-[#fafaf8]/90 backdrop-blur-xl px-4 md:px-6">
      <SidebarTrigger />

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#a09888]" />
        <input
          type="text"
          placeholder="Zoeken..."
          readOnly
          className="h-9 w-full rounded-lg border border-[#e3dfd5] bg-white pl-9 pr-16 text-sm text-[#261b07] placeholder:text-[#b5b0a5] focus:outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 cursor-pointer transition-all duration-150 hover:border-[#261b07]/20"
          onClick={() => {
            // Future: open command palette
          }}
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-5 items-center gap-0.5 rounded border border-[#e3dfd5] bg-[#f8f7f5] px-1.5 font-mono text-[10px] font-medium text-[#a09888] sm:inline-flex">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8a8478] hover:bg-[#e3dfd5]/50 hover:text-[#261b07] transition-colors duration-150"
          aria-label="Meldingen"
        >
          <Bell className="size-[18px]" strokeWidth={1.5} />
        </button>

        {/* User menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-all duration-150 hover:bg-[#e3dfd5]/50"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-[#261b07] text-[11px] font-semibold text-[#f8f7f5]">
              {initials}
            </span>
            <span className="hidden font-medium text-[#261b07] md:inline-block text-[13px]">
              {user.name}
            </span>
            <ChevronDown className={`hidden size-3.5 text-[#a09888] md:block transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-[#e3dfd5] bg-white p-1 shadow-[0_4px_24px_rgba(38,27,7,0.08)] animate-in fade-in-0 zoom-in-95 slide-in-from-top-1">
              <div className="px-3 py-2.5 border-b border-[#e3dfd5] mb-1">
                <p className="text-sm font-medium text-[#261b07]">{user.name}</p>
                <p className="text-[11px] text-[#a09888] mt-0.5">{mosque.name}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); router.push('/instellingen') }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#8a8478] transition-colors duration-150 hover:bg-[#f3f1ec] hover:text-[#261b07]"
              >
                <Settings className="size-4" strokeWidth={1.5} />
                Instellingen
              </button>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#8a8478] transition-colors duration-150 hover:bg-[#f3f1ec] hover:text-[#261b07]"
              >
                <LogOut className="size-4" strokeWidth={1.5} />
                Uitloggen
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
