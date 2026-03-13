'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Search, Bell, LogOut, ChevronDown } from 'lucide-react'

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

  // Close dropdown on outside click
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 md:px-6">
      {/* Sidebar trigger */}
      <SidebarTrigger />

      {/* Search bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70" />
        <input
          type="text"
          placeholder="Zoeken..."
          readOnly
          className="h-9 w-full rounded-lg border border-border/40 bg-muted/30 pl-9 pr-16 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring/40 cursor-pointer backdrop-blur-sm transition-all duration-150 hover:bg-muted/50 hover:border-border/60"
          onClick={() => {
            // Future: open command palette
          }}
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-5 items-center gap-0.5 rounded border border-border/50 bg-background/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/60 sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground/70 hover:text-foreground hover:bg-accent/60 transition-colors duration-150"
          aria-label="Meldingen"
        >
          <Bell className="size-4" />
        </Button>

        {/* User menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-all duration-150 hover:bg-accent/60"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-[11px] font-semibold text-primary-foreground shadow-sm">
              {initials}
            </span>
            <span className="hidden font-medium text-foreground md:inline-block">
              {user.name}
            </span>
            <ChevronDown className={`hidden size-3.5 text-muted-foreground/60 md:block transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-lg border border-border/40 bg-popover/95 backdrop-blur-xl p-1 shadow-xl shadow-black/5 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1">
              <div className="px-3 py-2.5 border-b border-border/30 mb-1">
                <p className="text-sm font-medium text-popover-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">{mosque.name}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent/60 hover:text-foreground"
              >
                <LogOut className="size-4" />
                Uitloggen
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
