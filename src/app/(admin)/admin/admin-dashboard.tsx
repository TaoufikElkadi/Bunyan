'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
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
  Heart,
  KeyRound,
  Plus,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  Search,
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
  created_at: string
  users: User[]
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-[#f3f1ec] text-[#8a8478] border-[#e3dfd5]',
  starter: 'bg-[#e8f0d4] text-[#4a7c10] border-[#d4e4b8]',
  growth: 'bg-[#f9a600]/10 text-[#8a6d00] border-[#f9a600]/20',
}

export function AdminDashboard({ mosques, metrics }: { mosques: Mosque[]; metrics: PlatformMetrics }) {
  const router = useRouter()
  const [expandedMosques, setExpandedMosques] = useState<Set<string>>(new Set())
  const [addMosqueOpen, setAddMosqueOpen] = useState(false)
  const [addUserMosqueId, setAddUserMosqueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Add Mosque form state
  const [mosqueName, setMosqueName] = useState('')
  const [mosqueSlug, setMosqueSlug] = useState('')
  const [mosqueCity, setMosqueCity] = useState('')

  // Add User form state
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState('admin')

  function toggleExpanded(id: string) {
    setExpandedMosques((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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

  const KPI_CARDS = [
    {
      title: 'Mosques',
      value: String(metrics.totalMosques),
      icon: Building2,
      subtitle: 'registered',
    },
    {
      title: 'Users',
      value: String(metrics.totalUsers),
      icon: Users,
      subtitle: 'across all mosques',
    },
    {
      title: 'Total Revenue',
      value: formatEur(metrics.totalRevenue),
      icon: Heart,
      subtitle: `${metrics.totalDonations} donations`,
    },
    {
      title: 'Monthly Revenue',
      value: formatEur(metrics.monthlyRevenue),
      icon: TrendingUp,
      subtitle: 'this month',
    },
  ]

  const inputClasses = "w-full rounded-lg border border-[#e3dfd5] bg-white px-4 py-2.5 text-[14px] text-[#261b07] placeholder:text-[#b5b0a5] outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors"
  const selectClasses = "w-full rounded-lg border border-[#e3dfd5] bg-white px-3 py-2.5 text-[14px] text-[#261b07] outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors"

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">Platform Overview</h1>
        <p className="text-[14px] text-[#8a8478] mt-1">
          Manage all mosques, users, and monitor platform metrics
        </p>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.title}
              className="rounded-xl border border-[#e3dfd5] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(38,27,7,0.06)] hover:border-[#d5cfb8]"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] font-medium text-[#a09888] uppercase tracking-wide">
                  {kpi.title}
                </p>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f1ec]">
                  <Icon className="h-4 w-4 text-[#8a8478]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[24px] font-bold tracking-tight text-[#261b07] leading-none">{kpi.value}</p>
              <p className="text-[11px] text-[#b5b0a5] mt-1.5">{kpi.subtitle}</p>
            </div>
          )
        })}
      </div>

      {/* Mosques section header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-semibold text-[#261b07]">Mosques</h2>
          <span className="inline-flex items-center rounded-full bg-[#f3f1ec] px-2.5 py-0.5 text-[12px] font-medium text-[#8a8478] tabular-nums">
            {mosques.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#a09888]" />
            <input
              type="text"
              placeholder="Search mosques..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-64 rounded-lg border border-[#e3dfd5] bg-white pl-9 pr-3 text-[13px] text-[#261b07] placeholder:text-[#b5b0a5] focus:outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors"
            />
          </div>

          <Dialog open={addMosqueOpen} onOpenChange={setAddMosqueOpen}>
            <DialogTrigger
              render={
                <button
                  onClick={() => { resetMosqueForm(); setAddMosqueOpen(true) }}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#261b07] text-[13px] font-medium text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Mosque
                </button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Mosque</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddMosque} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="mosque-name" className="text-[13px] font-medium text-[#261b07]">Name</Label>
                  <input
                    id="mosque-name"
                    value={mosqueName}
                    onChange={(e) => {
                      setMosqueName(e.target.value)
                      setMosqueSlug(slugify(e.target.value))
                    }}
                    placeholder="Mosque name"
                    required
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mosque-slug" className="text-[13px] font-medium text-[#261b07]">Slug</Label>
                  <input
                    id="mosque-slug"
                    value={mosqueSlug}
                    onChange={(e) => setMosqueSlug(e.target.value)}
                    placeholder="mosque-slug"
                    required
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mosque-city" className="text-[13px] font-medium text-[#261b07]">City</Label>
                  <input
                    id="mosque-city"
                    value={mosqueCity}
                    onChange={(e) => setMosqueCity(e.target.value)}
                    placeholder="City"
                    required
                    className={inputClasses}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <DialogClose
                    render={
                      <button className="h-9 px-4 rounded-lg border border-[#e3dfd5] bg-white text-[13px] font-medium text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors">
                        Cancel
                      </button>
                    }
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-9 px-4 rounded-lg bg-[#261b07] text-[13px] font-medium text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mosque list */}
      <div className="space-y-3">
        {filteredMosques.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e3dfd5] bg-white py-16">
            <div className="rounded-full bg-[#f3f1ec] p-5 mb-4">
              <Building2 className="h-7 w-7 text-[#a09888]" strokeWidth={1.5} />
            </div>
            <p className="text-[13px] text-[#8a8478]">
              {searchQuery ? 'No mosques match your search.' : 'No mosques yet. Add one to get started.'}
            </p>
          </div>
        )}

        {filteredMosques.map((mosque) => {
          const isExpanded = expandedMosques.has(mosque.id)
          const planColor = PLAN_COLORS[mosque.plan] ?? PLAN_COLORS.free

          return (
            <div key={mosque.id} className="rounded-xl border border-[#e3dfd5] bg-white overflow-hidden transition-all duration-200 hover:border-[#d5cfb8]">
              {/* Mosque header row */}
              <div className="flex items-center gap-3 px-5 py-4">
                <button
                  type="button"
                  onClick={() => toggleExpanded(mosque.id)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#a09888] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3f1ec]">
                  <Building2 className="h-4 w-4 text-[#8a8478]" strokeWidth={1.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-semibold text-[#261b07] truncate">{mosque.name}</h3>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${planColor}`}>
                      {mosque.plan}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[12px] text-[#a09888]">
                    <span>/{mosque.slug}</span>
                    <span className="text-[#e3dfd5]">&middot;</span>
                    <span>{mosque.city || '—'}</span>
                    <span className="text-[#e3dfd5]">&middot;</span>
                    <span>{mosque.users.length} user{mosque.users.length !== 1 ? 's' : ''}</span>
                    <span className="text-[#e3dfd5]">&middot;</span>
                    <span>{new Date(mosque.created_at).toLocaleDateString('nl-NL')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={mosque.plan}
                    onChange={(e) => handlePlanChange(mosque.id, e.target.value)}
                    disabled={loading}
                    className="h-7 rounded-lg border border-[#e3dfd5] bg-white px-2 text-[12px] font-medium text-[#261b07] transition-colors focus:border-[#261b07]/30 focus:outline-none focus:ring-1 focus:ring-[#261b07]/10"
                  >
                    <option value="free">free</option>
                    <option value="starter">starter</option>
                    <option value="growth">growth</option>
                  </select>

                  <button
                    onClick={() => handleDeleteMosque(mosque.id, mosque.name)}
                    disabled={loading}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#a09888] hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Delete mosque"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Expanded: users section */}
              {isExpanded && (
                <div className="border-t border-[#e3dfd5] px-5 py-4 bg-[#fafaf8]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[13px] font-medium text-[#261b07]">
                      Users ({mosque.users.length})
                    </h4>
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
                          <button className="inline-flex items-center gap-1 h-7 px-3 rounded-lg border border-[#e3dfd5] bg-white text-[12px] font-medium text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors">
                            <UserPlus className="h-3.5 w-3.5" />
                            Add User
                          </button>
                        }
                      />
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Add User to {mosque.name}
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
                              placeholder="user@example.com"
                              required
                              className={inputClasses}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`user-name-${mosque.id}`} className="text-[13px] font-medium text-[#261b07]">
                              Name
                            </Label>
                            <input
                              id={`user-name-${mosque.id}`}
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              placeholder="Full name"
                              required
                              className={inputClasses}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`user-role-${mosque.id}`} className="text-[13px] font-medium text-[#261b07]">
                              Role
                            </Label>
                            <select
                              id={`user-role-${mosque.id}`}
                              value={userRole}
                              onChange={(e) => setUserRole(e.target.value)}
                              className={selectClasses}
                            >
                              <option value="admin">Admin</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-2">
                            <DialogClose
                              render={
                                <button className="h-9 px-4 rounded-lg border border-[#e3dfd5] bg-white text-[13px] font-medium text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors">
                                  Cancel
                                </button>
                              }
                            />
                            <button
                              type="submit"
                              disabled={loading}
                              className="h-9 px-4 rounded-lg bg-[#261b07] text-[13px] font-medium text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors disabled:opacity-50"
                            >
                              {loading ? 'Adding...' : 'Add User'}
                            </button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {mosque.users.length === 0 ? (
                    <p className="text-[13px] text-[#a09888] py-2">
                      No users assigned to this mosque.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {mosque.users.map((user) => (
                        <div
                          key={user.id}
                          className={`flex items-center justify-between rounded-lg border px-4 py-3 text-[13px] ${
                            user.banned
                              ? 'border-red-200 bg-red-50/50'
                              : 'border-[#e3dfd5] bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3f1ec] text-[11px] font-semibold text-[#8a8478]">
                              {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[#261b07]">{user.name}</span>
                                {user.banned && (
                                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
                                    Banned
                                  </span>
                                )}
                              </div>
                              <span className="text-[12px] text-[#a09888]">{user.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(mosque.id, user.id, e.target.value)}
                              disabled={loading}
                              className="h-7 rounded-lg border border-[#e3dfd5] bg-white px-2 text-[12px] font-medium text-[#261b07] transition-colors focus:border-[#261b07]/30 focus:outline-none focus:ring-1 focus:ring-[#261b07]/10"
                            >
                              <option value="admin">admin</option>
                              <option value="viewer">viewer</option>
                            </select>
                            <button
                              onClick={() => handleResetPassword(user.id)}
                              disabled={loading}
                              title="Reset password"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-[#a09888] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleBan(user.id, user.name, user.banned)}
                              disabled={loading}
                              title={user.banned ? 'Unban user' : 'Ban user'}
                              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                                user.banned
                                  ? 'text-[#4a7c10] hover:bg-[#e8f0d4]'
                                  : 'text-[#a09888] hover:bg-red-50 hover:text-red-500'
                              }`}
                            >
                              {user.banned ? <ShieldCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => handleRemoveUser(mosque.id, user.id, user.name)}
                              disabled={loading}
                              title="Remove user"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-[#a09888] hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
      </div>

      {/* Temp password modal */}
      <Dialog open={!!tempPassword} onOpenChange={(open) => { if (!open) setTempPassword(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporary Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-[13px] text-[#8a8478]">
              Share this temporary password with the user. They should change it after logging in.
            </p>
            <code className="block rounded-lg bg-[#f3f1ec] border border-[#e3dfd5] px-4 py-3 text-[14px] font-mono text-[#261b07] select-all">
              {tempPassword}
            </code>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => { navigator.clipboard.writeText(tempPassword ?? ''); setTempPassword(null) }}
              className="h-9 px-4 rounded-lg bg-[#261b07] text-[13px] font-medium text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors"
            >
              Copy & Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
