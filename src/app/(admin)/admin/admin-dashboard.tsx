'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Ban,
  Building2,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Globe,
  Heart,
  KeyRound,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'

interface PlatformMetrics {
  totalMosques: number
  totalDonations: number
  totalRevenue: number
  totalUsers: number
  monthlyRevenue: number
}

const formatEur = (cents: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)

interface User {
  id: string
  name: string
  email: string
  role: string
  banned: boolean
  mosque_id: string
  created_at: string
}

interface Mosque {
  id: string
  name: string
  slug: string
  city: string
  plan: string
  status: 'pending' | 'active' | 'rejected'
  created_at: string
  users: User[]
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

const PLAN_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  free: { bg: 'bg-[#f3f1ec]', text: 'text-[#8a8478]', dot: 'bg-[#b5b0a5]' },
  starter: { bg: 'bg-[#e8f5e9]', text: 'text-[#2e7d32]', dot: 'bg-[#4caf50]' },
  growth: { bg: 'bg-[#fff8e1]', text: 'text-[#f57f17]', dot: 'bg-[#f9a600]' },
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', label: 'Wacht op goedkeuring' },
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Actief' },
  rejected: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400', label: 'Afgewezen' },
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'vandaag'
  if (diffDays === 1) return 'gisteren'
  if (diffDays < 7) return `${diffDays}d geleden`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w geleden`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}m geleden`
  return `${Math.floor(diffDays / 365)}j geleden`
}

export function AdminDashboard({ mosques, metrics }: { mosques: Mosque[]; metrics: PlatformMetrics }) {
  const router = useRouter()
  const [expandedMosqueId, setExpandedMosqueId] = useState<string | null>(null)
  const [addMosqueOpen, setAddMosqueOpen] = useState(false)
  const [addUserMosqueId, setAddUserMosqueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  // Add Mosque form state
  const [mosqueName, setMosqueName] = useState('')
  const [mosqueSlug, setMosqueSlug] = useState('')
  const [mosqueCity, setMosqueCity] = useState('')

  // Add User form state
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState('admin')

  function toggleExpanded(id: string) {
    setExpandedMosqueId((prev) => (prev === id ? null : id))
  }

  function resetMosqueForm() {
    setMosqueName('')
    setMosqueSlug('')
    setMosqueCity('')
  }

  function resetUserForm() {
    setUserEmail('')
    setUserName('')
    setUserRole('admin')
  }

  async function handleAddMosque(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/mosques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mosqueName,
          slug: mosqueSlug,
          city: mosqueCity,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to create mosque')
        return
      }
      setAddMosqueOpen(false)
      resetMosqueForm()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleAddUser(e: React.FormEvent, mosqueId: string) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/mosques/${mosqueId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          role: userRole,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to add user')
        return
      }
      setAddUserMosqueId(null)
      resetUserForm()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteMosque(mosqueId: string, mosqueName: string) {
    if (!window.confirm(`Delete "${mosqueName}"? This cannot be undone.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/mosques/${mosqueId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to delete mosque')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(mosqueId: string, newStatus: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/mosques/${mosqueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to update status')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handlePlanChange(mosqueId: string, newPlan: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/mosques/${mosqueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to update plan')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveUser(mosqueId: string, userId: string, userName: string) {
    if (!window.confirm(`Remove user "${userName}" from this mosque?`)) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/mosques/${mosqueId}/users?userId=${userId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to remove user')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleBan(userId: string, userName: string, currentlyBanned: boolean) {
    const action = currentlyBanned ? 'unban' : 'ban'
    if (!window.confirm(`${currentlyBanned ? 'Unban' : 'Ban'} user "${userName}"?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to update user')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(userId: string) {
    if (!window.confirm('Generate a temporary password for this user?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to reset password')
        return
      }
      const data = await res.json()
      setTempPassword(data.temporaryPassword)
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(mosqueId: string, userId: string, newRole: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, mosqueId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to change role')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const filteredMosques = searchQuery
    ? mosques.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.city?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mosques

  const inputClasses = "w-full rounded-lg border border-[#e3dfd5] bg-white px-4 py-2.5 text-[14px] text-[#261b07] placeholder:text-[#b5b0a5] outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors"
  const selectClasses = "w-full rounded-lg border border-[#e3dfd5] bg-white px-3 py-2.5 text-[14px] text-[#261b07] outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors"

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.5px] text-[#261b07]">Mosques</h1>
          <p className="text-[14px] text-[#a09888] mt-0.5">
            Beheer alle moskeeën op het platform
          </p>
        </div>
        <Dialog open={addMosqueOpen} onOpenChange={setAddMosqueOpen}>
          <DialogTrigger
            render={
              <button
                onClick={() => { resetMosqueForm(); setAddMosqueOpen(true) }}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#261b07] text-[13px] font-medium text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Moskee toevoegen
              </button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe moskee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMosque} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="mosque-name" className="text-[13px] font-medium text-[#261b07]">Naam</Label>
                <input
                  id="mosque-name"
                  value={mosqueName}
                  onChange={(e) => {
                    setMosqueName(e.target.value)
                    setMosqueSlug(slugify(e.target.value))
                  }}
                  placeholder="Al-Hijra Moskee"
                  required
                  className={inputClasses}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mosque-slug" className="text-[13px] font-medium text-[#261b07]">Slug</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-[#b5b0a5]">bunyan.io/doneren/</span>
                  <input
                    id="mosque-slug"
                    value={mosqueSlug}
                    onChange={(e) => setMosqueSlug(e.target.value)}
                    placeholder="al-hijra"
                    required
                    className={`${inputClasses} pl-[148px]`}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mosque-city" className="text-[13px] font-medium text-[#261b07]">Stad</Label>
                <input
                  id="mosque-city"
                  value={mosqueCity}
                  onChange={(e) => setMosqueCity(e.target.value)}
                  placeholder="Amsterdam"
                  required
                  className={inputClasses}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <DialogClose
                  render={
                    <button className="h-9 px-4 rounded-lg border border-[#e3dfd5] bg-white text-[13px] font-medium text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors">
                      Annuleren
                    </button>
                  }
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="h-9 px-4 rounded-lg bg-[#261b07] text-[13px] font-medium text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Aanmaken...' : 'Aanmaken'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#e3dfd5] bg-white px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f3f1ec]">
              <Building2 className="h-3 w-3 text-[#8a8478]" strokeWidth={2} />
            </div>
            <span className="text-[11px] font-medium text-[#a09888] uppercase tracking-wide">Moskeeën</span>
          </div>
          <p className="text-[22px] font-bold tracking-tight text-[#261b07]">{metrics.totalMosques}</p>
        </div>
        <div className="rounded-xl border border-[#e3dfd5] bg-white px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f3f1ec]">
              <Users className="h-3 w-3 text-[#8a8478]" strokeWidth={2} />
            </div>
            <span className="text-[11px] font-medium text-[#a09888] uppercase tracking-wide">Gebruikers</span>
          </div>
          <p className="text-[22px] font-bold tracking-tight text-[#261b07]">{metrics.totalUsers}</p>
        </div>
        <div className="rounded-xl border border-[#e3dfd5] bg-white px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f3f1ec]">
              <Heart className="h-3 w-3 text-[#8a8478]" strokeWidth={2} />
            </div>
            <span className="text-[11px] font-medium text-[#a09888] uppercase tracking-wide">Totale omzet</span>
          </div>
          <p className="text-[22px] font-bold tracking-tight text-[#261b07]">{formatEur(metrics.totalRevenue)}</p>
          <p className="text-[11px] text-[#b5b0a5] mt-0.5">{metrics.totalDonations} donaties</p>
        </div>
        <div className="rounded-xl border border-[#e3dfd5] bg-white px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f3f1ec]">
              <TrendingUp className="h-3 w-3 text-[#8a8478]" strokeWidth={2} />
            </div>
            <span className="text-[11px] font-medium text-[#a09888] uppercase tracking-wide">Deze maand</span>
          </div>
          <p className="text-[22px] font-bold tracking-tight text-[#261b07]">{formatEur(metrics.monthlyRevenue)}</p>
        </div>
      </div>

      {/* Search & filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b5b0a5]" />
          <input
            type="text"
            placeholder="Zoek op naam, slug of stad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-[#e3dfd5] bg-white pl-10 pr-4 text-[13px] text-[#261b07] placeholder:text-[#b5b0a5] focus:outline-none focus:border-[#261b07]/20 focus:ring-2 focus:ring-[#261b07]/5 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[#a09888]">
          <span className="tabular-nums">{filteredMosques.length}</span>
          <span>van</span>
          <span className="tabular-nums">{mosques.length}</span>
        </div>
      </div>

      {/* Mosque list */}
      <div className="rounded-xl border border-[#e3dfd5] bg-white overflow-hidden divide-y divide-[#f0ede8]">
        {filteredMosques.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="rounded-full bg-[#f3f1ec] p-5 mb-4">
              <Building2 className="h-7 w-7 text-[#a09888]" strokeWidth={1.5} />
            </div>
            <p className="text-[14px] font-medium text-[#261b07] mb-1">
              {searchQuery ? 'Geen resultaten' : 'Nog geen moskeeën'}
            </p>
            <p className="text-[13px] text-[#a09888]">
              {searchQuery ? 'Probeer een andere zoekopdracht.' : 'Voeg een moskee toe om te beginnen.'}
            </p>
          </div>
        )}

        {filteredMosques.map((mosque) => {
          const isExpanded = expandedMosqueId === mosque.id
          const planStyle = PLAN_STYLES[mosque.plan] ?? PLAN_STYLES.free

          return (
            <div key={mosque.id}>
              {/* Mosque row */}
              <div
                className={`group flex items-center gap-4 px-5 py-4 transition-colors cursor-pointer ${
                  isExpanded ? 'bg-[#fafaf8]' : 'hover:bg-[#fdfcfb]'
                }`}
                onClick={() => toggleExpanded(mosque.id)}
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3f1ec] border border-[#e3dfd5]">
                  <Building2 className="h-4 w-4 text-[#8a8478]" strokeWidth={1.5} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[14px] font-semibold text-[#261b07] truncate">{mosque.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(`bunyan.io/doneren/${mosque.slug}`)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Kopieer URL"
                    >
                      <Copy className="h-3 w-3 text-[#b5b0a5] hover:text-[#261b07]" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className="text-[12px] text-[#a09888]">/doneren/{mosque.slug}</span>
                    {mosque.city && (
                      <>
                        <span className="text-[12px] text-[#e3dfd5]">&middot;</span>
                        <span className="flex items-center gap-0.5 text-[12px] text-[#a09888]">
                          <MapPin className="h-2.5 w-2.5" />
                          {mosque.city}
                        </span>
                      </>
                    )}
                    <span className="text-[12px] text-[#e3dfd5]">&middot;</span>
                    <span className="text-[12px] text-[#a09888]">{timeAgo(mosque.created_at)}</span>
                  </div>
                </div>

                {/* Right side: plan + users + actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* User count pill */}
                  <div className="flex items-center gap-1.5 rounded-full bg-[#f3f1ec] px-2.5 py-1 text-[11px] font-medium text-[#8a8478]">
                    <Users className="h-3 w-3" />
                    {mosque.users.length}
                  </div>

                  {/* Status badge */}
                  {mosque.status !== 'active' && (() => {
                    const statusStyle = STATUS_STYLES[mosque.status] ?? STATUS_STYLES.pending
                    return (
                      <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                        {statusStyle.label}
                      </div>
                    )
                  })()}

                  {/* Plan badge */}
                  <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${planStyle.bg} ${planStyle.text}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${planStyle.dot}`} />
                    {mosque.plan}
                  </div>

                  {/* Actions dropdown */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setActionMenuId(actionMenuId === mosque.id ? null : mosque.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#b5b0a5] opacity-0 group-hover:opacity-100 hover:bg-[#f3f1ec] hover:text-[#261b07] transition-all"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {actionMenuId === mosque.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
                        <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-xl border border-[#e3dfd5] bg-white py-1 shadow-lg shadow-black/[0.08]">
                          {mosque.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  handleStatusChange(mosque.id, 'active')
                                  setActionMenuId(null)
                                }}
                                disabled={loading}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-emerald-600 hover:bg-emerald-50 transition-colors font-medium"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Goedkeuren
                              </button>
                              <button
                                onClick={() => {
                                  handleStatusChange(mosque.id, 'rejected')
                                  setActionMenuId(null)
                                }}
                                disabled={loading}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Ban className="h-3.5 w-3.5" />
                                Afwijzen
                              </button>
                              <div className="my-1 border-t border-[#f0ede8]" />
                            </>
                          )}
                          {mosque.status === 'rejected' && (
                            <>
                              <button
                                onClick={() => {
                                  handleStatusChange(mosque.id, 'active')
                                  setActionMenuId(null)
                                }}
                                disabled={loading}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-emerald-600 hover:bg-emerald-50 transition-colors font-medium"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Alsnog goedkeuren
                              </button>
                              <div className="my-1 border-t border-[#f0ede8]" />
                            </>
                          )}
                          <button
                            onClick={() => {
                              window.open(`/doneren/${mosque.slug}`, '_blank')
                              setActionMenuId(null)
                            }}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#8a8478] hover:bg-[#faf9f7] hover:text-[#261b07] transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Donatiepagina openen
                          </button>
                          <div className="my-1 border-t border-[#f0ede8]" />
                          <div className="px-3.5 py-1.5">
                            <p className="text-[10px] font-medium text-[#b5b0a5] uppercase tracking-wide mb-1">Plan wijzigen</p>
                            <div className="flex gap-1">
                              {['free', 'starter', 'growth'].map((plan) => (
                                <button
                                  key={plan}
                                  onClick={() => {
                                    handlePlanChange(mosque.id, plan)
                                    setActionMenuId(null)
                                  }}
                                  disabled={loading}
                                  className={`flex-1 rounded-md px-2 py-1 text-[11px] font-medium capitalize transition-colors ${
                                    mosque.plan === plan
                                      ? 'bg-[#261b07] text-white'
                                      : 'bg-[#f3f1ec] text-[#8a8478] hover:bg-[#e3dfd5]'
                                  }`}
                                >
                                  {plan}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="my-1 border-t border-[#f0ede8]" />
                          <button
                            onClick={() => {
                              handleDeleteMosque(mosque.id, mosque.name)
                              setActionMenuId(null)
                            }}
                            disabled={loading}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Verwijderen
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Expand chevron */}
                  <ChevronRight className={`h-4 w-4 text-[#b5b0a5] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </div>

              {/* Expanded: users section */}
              {isExpanded && (
                <div className="border-t border-[#f0ede8] bg-[#fafaf8]">
                  <div className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-[#a09888]" />
                      <span className="text-[12px] font-semibold text-[#261b07] uppercase tracking-wide">
                        Team
                      </span>
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#e3dfd5] px-1.5 text-[10px] font-bold text-[#8a8478] tabular-nums">
                        {mosque.users.length}
                      </span>
                    </div>
                    <Dialog
                      open={addUserMosqueId === mosque.id}
                      onOpenChange={(open) => {
                        if (open) {
                          resetUserForm()
                          setAddUserMosqueId(mosque.id)
                        } else {
                          setAddUserMosqueId(null)
                        }
                      }}
                    >
                      <DialogTrigger
                        render={
                          <button className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-medium text-[#8a8478] hover:bg-white hover:text-[#261b07] border border-transparent hover:border-[#e3dfd5] transition-all">
                            <UserPlus className="h-3 w-3" />
                            Toevoegen
                          </button>
                        }
                      />
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Gebruiker toevoegen aan {mosque.name}
                          </DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={(e) => handleAddUser(e, mosque.id)}
                          className="space-y-4 mt-2"
                        >
                          <div className="space-y-1.5">
                            <Label htmlFor={`user-email-${mosque.id}`} className="text-[13px] font-medium text-[#261b07]">
                              Email
                            </Label>
                            <input
                              id={`user-email-${mosque.id}`}
                              type="email"
                              value={userEmail}
                              onChange={(e) => setUserEmail(e.target.value)}
                              placeholder="gebruiker@voorbeeld.nl"
                              required
                              className={inputClasses}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`user-name-${mosque.id}`} className="text-[13px] font-medium text-[#261b07]">
                              Naam
                            </Label>
                            <input
                              id={`user-name-${mosque.id}`}
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              placeholder="Volledige naam"
                              required
                              className={inputClasses}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`user-role-${mosque.id}`} className="text-[13px] font-medium text-[#261b07]">
                              Rol
                            </Label>
                            <select
                              id={`user-role-${mosque.id}`}
                              value={userRole}
                              onChange={(e) => setUserRole(e.target.value)}
                              className={selectClasses}
                            >
                              <option value="admin">Beheerder</option>
                              <option value="viewer">Alleen lezen</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-2">
                            <DialogClose
                              render={
                                <button className="h-9 px-4 rounded-lg border border-[#e3dfd5] bg-white text-[13px] font-medium text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors">
                                  Annuleren
                                </button>
                              }
                            />
                            <button
                              type="submit"
                              disabled={loading}
                              className="h-9 px-4 rounded-lg bg-[#261b07] text-[13px] font-medium text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors disabled:opacity-50"
                            >
                              {loading ? 'Toevoegen...' : 'Toevoegen'}
                            </button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {mosque.users.length === 0 ? (
                    <div className="px-5 pb-4">
                      <p className="text-[13px] text-[#a09888] py-3 text-center">
                        Nog geen gebruikers toegewezen.
                      </p>
                    </div>
                  ) : (
                    <div className="px-5 pb-4 space-y-1">
                      {mosque.users.map((user) => (
                        <div
                          key={user.id}
                          className={`group/user flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                            user.banned
                              ? 'bg-red-50/80'
                              : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                              user.banned
                                ? 'bg-red-100 text-red-600'
                                : 'bg-[#261b07] text-white'
                            }`}>
                              {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[#261b07]">{user.name}</span>
                                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                                  user.role === 'admin'
                                    ? 'bg-[#f3f1ec] text-[#8a8478]'
                                    : 'bg-[#f3f1ec] text-[#b5b0a5]'
                                }`}>
                                  {user.role === 'admin' ? 'Beheerder' : 'Viewer'}
                                </span>
                                {user.banned && (
                                  <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                                    Geblokkeerd
                                  </span>
                                )}
                              </div>
                              <span className="text-[12px] text-[#a09888]">{user.email}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 opacity-0 group-hover/user:opacity-100 transition-opacity">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(mosque.id, user.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={loading}
                              className="h-7 rounded-md border border-[#e3dfd5] bg-white px-1.5 text-[11px] font-medium text-[#261b07] transition-colors focus:border-[#261b07]/30 focus:outline-none"
                            >
                              <option value="admin">admin</option>
                              <option value="viewer">viewer</option>
                            </select>
                            <button
                              onClick={() => handleResetPassword(user.id)}
                              disabled={loading}
                              title="Wachtwoord resetten"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-[#a09888] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors"
                            >
                              <KeyRound className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleToggleBan(user.id, user.name, user.banned)}
                              disabled={loading}
                              title={user.banned ? 'Deblokkeren' : 'Blokkeren'}
                              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                                user.banned
                                  ? 'text-[#4a7c10] hover:bg-[#e8f0d4]'
                                  : 'text-[#a09888] hover:bg-red-50 hover:text-red-500'
                              }`}
                            >
                              {user.banned ? <ShieldCheck className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                            </button>
                            <button
                              onClick={() => handleRemoveUser(mosque.id, user.id, user.name)}
                              disabled={loading}
                              title="Verwijderen"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-[#a09888] hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Footer */}
        {filteredMosques.length > 0 && (
          <div className="px-5 py-3 text-[12px] text-[#b5b0a5] bg-[#fafaf8]">
            {filteredMosques.length} moskee{filteredMosques.length !== 1 ? 'ën' : ''}
          </div>
        )}
      </div>

      {/* Temp password modal */}
      <Dialog open={!!tempPassword} onOpenChange={(open) => { if (!open) setTempPassword(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tijdelijk wachtwoord</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-[13px] text-[#8a8478]">
              Deel dit tijdelijke wachtwoord met de gebruiker. Ze dienen het na inloggen te wijzigen.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-[#f3f1ec] border border-[#e3dfd5] px-4 py-3 text-[14px] font-mono text-[#261b07] select-all">
                {tempPassword}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(tempPassword ?? '')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#e3dfd5] bg-white text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors"
                title="Kopiëren"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => { navigator.clipboard.writeText(tempPassword ?? ''); setTempPassword(null) }}
              className="h-9 px-4 rounded-lg bg-[#261b07] text-[13px] font-medium text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors"
            >
              Kopiëren en sluiten
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
