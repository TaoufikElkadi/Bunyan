'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { formatMoney } from '@/lib/money'
import {
  Search,
  Bell,
  LogOut,
  ChevronDown,
  Settings,
  X,
  Users,
  Landmark,
  Megaphone,
  FileText,
  Loader2,
} from 'lucide-react'

interface DashboardHeaderProps {
  user: { name: string; role: string }
  mosque: { name: string }
}

type PageResult = {
  type: 'page'
  label: string
  href: string
}

type DonorResult = {
  type: 'donor'
  id: string
  name: string | null
  email: string | null
  total_donated: number
}

type FundResult = {
  type: 'fund'
  id: string
  name: string
  is_active: boolean
}

type CampaignResult = {
  type: 'campaign'
  id: string
  title: string
  slug: string
  is_active: boolean
}

type SearchItem = PageResult | DonorResult | FundResult | CampaignResult

const NAV_ITEMS: PageResult[] = [
  { type: 'page', label: 'Dashboard', href: '/dashboard' },
  { type: 'page', label: 'Donaties', href: '/donaties' },
  { type: 'page', label: 'Donateurs', href: '/leden' },
  { type: 'page', label: 'Leden', href: '/leden' },
  { type: 'page', label: 'Fondsen', href: '/fondsen' },
  { type: 'page', label: 'Campagnes', href: '/campagnes' },
  { type: 'page', label: 'Collecte', href: '/collecte' },
  { type: 'page', label: 'Contributie', href: '/contributie' },
  { type: 'page', label: 'ANBI', href: '/anbi' },
  { type: 'page', label: 'Giftenverklaring', href: '/anbi' },
  { type: 'page', label: 'QR Codes', href: '/qr' },
  { type: 'page', label: 'Instellingen', href: '/instellingen' },
  { type: 'page', label: 'Team beheren', href: '/instellingen' },
  { type: 'page', label: 'Activiteitenlog', href: '/audit' },
]

interface SearchResults {
  donors: Array<{ id: string; name: string | null; email: string | null; total_donated: number }>
  funds: Array<{ id: string; name: string; is_active: boolean }>
  campaigns: Array<{ id: string; title: string; slug: string; is_active: boolean }>
}

function getHref(item: SearchItem): string {
  switch (item.type) {
    case 'page':
      return item.href
    case 'donor':
      return `/leden/${item.id}`
    case 'fund':
      return '/fondsen'
    case 'campaign':
      return '/campagnes'
  }
}

export function DashboardHeader({ user, mosque }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [apiResults, setApiResults] = useState<SearchResults | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // Build flat list of all results for keyboard navigation
  const trimmed = query.trim().toLowerCase()

  const pageResults: PageResult[] =
    trimmed.length > 0
      ? NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(trimmed)).slice(0, 5)
      : []

  const donorItems: DonorResult[] = (apiResults?.donors ?? []).map((d) => ({ type: 'donor' as const, ...d }))
  const fundItems: FundResult[] = (apiResults?.funds ?? []).map((f) => ({ type: 'fund' as const, ...f }))
  const campaignItems: CampaignResult[] = (apiResults?.campaigns ?? []).map((c) => ({ type: 'campaign' as const, ...c }))

  // Group order: Donateurs, Fondsen, Campagnes, Pagina's
  const allResults: SearchItem[] = [...donorItems, ...fundItems, ...campaignItems, ...pageResults]
  const hasResults = allResults.length > 0

  // Fetch search results with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortRef.current) abortRef.current.abort()

    if (trimmed.length < 2) {
      setApiResults(null)
      setLoading(false)
      return
    }

    setLoading(true)

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        if (res.ok) {
          const data: SearchResults = await res.json()
          setApiResults(data)
        } else {
          setApiResults(null)
        }
      } catch {
        // aborted or network error — ignore
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed])

  function openSearch() {
    setSearchOpen(true)
    setQuery('')
    setApiResults(null)
    setSelectedIndex(0)
    setTimeout(() => searchInputRef.current?.focus(), 0)
  }

  function closeSearch() {
    setSearchOpen(false)
    setQuery('')
    setApiResults(null)
    if (abortRef.current) abortRef.current.abort()
  }

  function navigate(href: string) {
    closeSearch()
    router.push(href)
  }

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSearch()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && allResults[selectedIndex]) {
        navigate(getHref(allResults[selectedIndex]))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allResults, selectedIndex],
  )

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (searchOpen) closeSearch()
        else openSearch()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchOpen])

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

  // Close search on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        closeSearch()
      }
    }
    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchOpen])

  // Track the flat index so we can render group headers properly
  let flatIndex = 0

  function renderGroup<T extends SearchItem>(
    items: T[],
    label: string,
    Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>,
    renderItem: (item: T, idx: number) => React.ReactNode,
  ) {
    if (items.length === 0) return null
    const startIndex = flatIndex
    flatIndex += items.length
    return (
      <div key={label}>
        <div className="flex items-center gap-2 px-3 pt-2 pb-1">
          <Icon className="size-3.5 text-[#a09888]" strokeWidth={1.5} />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#a09888]">
            {label}
          </span>
        </div>
        {items.map((item, i) => renderItem(item, startIndex + i))}
      </div>
    )
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#e3dfd5] bg-[#fafaf8]/90 backdrop-blur-xl px-4 md:px-6">
      <SidebarTrigger />

      {/* Search */}
      <div className="relative max-w-md flex-shrink-0 w-full sm:w-80" ref={searchContainerRef}>
        {!searchOpen ? (
          <button
            onClick={openSearch}
            className="flex h-9 w-full items-center gap-2 rounded-lg border border-[#e3dfd5] bg-white pl-3 pr-3 text-sm text-[#b5b0a5] transition-all duration-150 hover:border-[#261b07]/20"
          >
            <Search className="size-4 text-[#a09888] shrink-0" />
            <span className="flex-1 text-left">Zoeken...</span>
            <kbd className="hidden h-5 items-center gap-0.5 rounded border border-[#e3dfd5] bg-[#f8f7f5] px-1.5 font-mono text-[10px] font-medium text-[#a09888] sm:inline-flex">
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </button>
        ) : (
          <div>
            <div className="flex h-9 items-center gap-2 rounded-lg border border-[#261b07]/30 bg-white pl-3 pr-2 ring-1 ring-[#261b07]/10">
              {loading ? (
                <Loader2 className="size-4 text-[#a09888] shrink-0 animate-spin" />
              ) : (
                <Search className="size-4 text-[#a09888] shrink-0" />
              )}
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelectedIndex(0)
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Zoek donateurs, fondsen, campagnes..."
                className="flex-1 bg-transparent text-sm text-[#261b07] placeholder:text-[#b5b0a5] outline-none"
              />
              <button
                onClick={closeSearch}
                className="flex size-6 items-center justify-center rounded-md text-[#a09888] hover:bg-[#f3f1ec] hover:text-[#261b07]"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {trimmed.length > 0 && (hasResults || !loading) && (
              <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-[#e3dfd5] bg-white shadow-[0_8px_32px_rgba(38,27,7,0.1)] overflow-hidden">
                {hasResults ? (
                  <div className="p-1">
                    {/* Reset flat index for each render */}
                    {(() => { flatIndex = 0; return null })()}

                    {renderGroup(donorItems, 'Donateurs', Users, (item, idx) => (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/leden/${item.id}`)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                          idx === selectedIndex
                            ? 'bg-[#f3f1ec] text-[#261b07]'
                            : 'text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07]'
                        }`}
                      >
                        <div className="flex flex-col items-start min-w-0">
                          <span className="font-medium truncate">{item.name ?? 'Anoniem'}</span>
                          {item.email && (
                            <span className="text-[11px] text-[#b5b0a5] truncate">{item.email}</span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#b5b0a5] shrink-0 ml-3">
                          {formatMoney(item.total_donated)}
                        </span>
                      </button>
                    ))}

                    {renderGroup(fundItems, 'Fondsen', Landmark, (item, idx) => (
                      <button
                        key={item.id}
                        onClick={() => navigate('/fondsen')}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                          idx === selectedIndex
                            ? 'bg-[#f3f1ec] text-[#261b07]'
                            : 'text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07]'
                        }`}
                      >
                        <span className="font-medium truncate">{item.name}</span>
                        <span
                          className={`shrink-0 ml-3 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                            item.is_active
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-[#f3f1ec] text-[#a09888]'
                          }`}
                        >
                          {item.is_active ? 'Actief' : 'Inactief'}
                        </span>
                      </button>
                    ))}

                    {renderGroup(campaignItems, 'Campagnes', Megaphone, (item, idx) => (
                      <button
                        key={item.id}
                        onClick={() => navigate('/campagnes')}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                          idx === selectedIndex
                            ? 'bg-[#f3f1ec] text-[#261b07]'
                            : 'text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07]'
                        }`}
                      >
                        <span className="font-medium truncate">{item.title}</span>
                        <span
                          className={`shrink-0 ml-3 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                            item.is_active
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-[#f3f1ec] text-[#a09888]'
                          }`}
                        >
                          {item.is_active ? 'Actief' : 'Inactief'}
                        </span>
                      </button>
                    ))}

                    {renderGroup(pageResults, "Pagina's", FileText, (item, idx) => (
                      <button
                        key={`${item.href}-${item.label}`}
                        onClick={() => navigate(item.href)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                          idx === selectedIndex
                            ? 'bg-[#f3f1ec] text-[#261b07]'
                            : 'text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07]'
                        }`}
                      >
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4">
                    <p className="text-sm text-[#b5b0a5] text-center">
                      Geen resultaten voor &ldquo;{query}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spacer to push actions to the right */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
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
            <ChevronDown
              className={`hidden size-3.5 text-[#a09888] md:block transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-[#e3dfd5] bg-white p-1 shadow-[0_4px_24px_rgba(38,27,7,0.08)] animate-in fade-in-0 zoom-in-95 slide-in-from-top-1">
              <div className="px-3 py-2.5 border-b border-[#e3dfd5] mb-1">
                <p className="text-sm font-medium text-[#261b07]">{user.name}</p>
                <p className="text-[11px] text-[#a09888] mt-0.5">{mosque.name}</p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  router.push('/instellingen')
                }}
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
