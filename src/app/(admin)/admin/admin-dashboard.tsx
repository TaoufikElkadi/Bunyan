'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Ban, Building2, ChevronDown, ChevronRight, Heart, KeyRound, Plus, ShieldCheck, Trash2, UserPlus } from 'lucide-react'

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

export function AdminDashboard({ mosques, metrics }: { mosques: Mosque[]; metrics: PlatformMetrics }) {
  const router = useRouter()
  const [expandedMosques, setExpandedMosques] = useState<Set<string>>(new Set())
  const [addMosqueOpen, setAddMosqueOpen] = useState(false)
  const [addUserMosqueId, setAddUserMosqueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

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

  return (
    <div className="space-y-6">
      {/* Metrics cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mosques
            </CardTitle>
            <CardAction>
              <Building2 className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.totalMosques}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Donations
            </CardTitle>
            <CardAction>
              <Heart className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.totalDonations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <CardAction>
              <span className="text-sm text-muted-foreground">EUR</span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatEur(metrics.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
            <CardAction>
              <span className="text-sm text-muted-foreground">EUR</span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatEur(metrics.monthlyRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Overview</h2>
          <p className="text-muted-foreground">
            {mosques.length} mosque{mosques.length !== 1 ? 's' : ''} registered
            {' · '}{metrics.totalUsers} user{metrics.totalUsers !== 1 ? 's' : ''}
          </p>
        </div>

        <Dialog open={addMosqueOpen} onOpenChange={setAddMosqueOpen}>
          <DialogTrigger
            render={
              <Button onClick={() => { resetMosqueForm(); setAddMosqueOpen(true) }}>
                <Plus className="mr-2 size-4" />
                Add Mosque
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Mosque</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMosque} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mosque-name">Name</Label>
                <Input
                  id="mosque-name"
                  value={mosqueName}
                  onChange={(e) => {
                    setMosqueName(e.target.value)
                    setMosqueSlug(slugify(e.target.value))
                  }}
                  placeholder="Mosque name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mosque-slug">Slug</Label>
                <Input
                  id="mosque-slug"
                  value={mosqueSlug}
                  onChange={(e) => setMosqueSlug(e.target.value)}
                  placeholder="mosque-slug"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mosque-city">City</Label>
                <Input
                  id="mosque-city"
                  value={mosqueCity}
                  onChange={(e) => setMosqueCity(e.target.value)}
                  placeholder="City"
                  required
                />
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mosque list */}
      <div className="space-y-4">
        {mosques.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No mosques yet. Add one to get started.
          </p>
        )}

        {mosques.map((mosque) => {
          const isExpanded = expandedMosques.has(mosque.id)
          return (
            <Card key={mosque.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(mosque.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </button>
                  <CardTitle>{mosque.name}</CardTitle>
                </div>
                <CardAction>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteMosque(mosque.id, mosque.name)}
                    disabled={loading}
                  >
                    <Trash2 className="mr-1 size-4" />
                    Delete
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  <span>
                    <span className="font-medium text-foreground">Slug:</span>{' '}
                    {mosque.slug}
                  </span>
                  <span>
                    <span className="font-medium text-foreground">City:</span>{' '}
                    {mosque.city || '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-foreground">Plan:</span>{' '}
                    <select
                      value={mosque.plan}
                      onChange={(e) => handlePlanChange(mosque.id, e.target.value)}
                      disabled={loading}
                      className="flex h-6 rounded-lg border border-input bg-transparent px-1.5 text-xs font-medium transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                    >
                      <option value="free">free</option>
                      <option value="starter">starter</option>
                      <option value="growth">growth</option>
                    </select>
                  </span>
                  <span>
                    <span className="font-medium text-foreground">Created:</span>{' '}
                    {new Date(mosque.created_at).toLocaleDateString('nl-NL')}
                  </span>
                </div>

                {/* Expanded: users section */}
                {isExpanded && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">
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
                            <Button variant="outline" size="sm">
                              <UserPlus className="mr-1 size-4" />
                              Add User
                            </Button>
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
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <Label htmlFor={`user-email-${mosque.id}`}>
                                Email
                              </Label>
                              <Input
                                id={`user-email-${mosque.id}`}
                                type="email"
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                                placeholder="user@example.com"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`user-name-${mosque.id}`}>
                                Name
                              </Label>
                              <Input
                                id={`user-name-${mosque.id}`}
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="Full name"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`user-role-${mosque.id}`}>
                                Role
                              </Label>
                              <select
                                id={`user-role-${mosque.id}`}
                                value={userRole}
                                onChange={(e) => setUserRole(e.target.value)}
                                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                              >
                                <option value="admin">Admin</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            </div>
                            <DialogFooter>
                              <DialogClose render={<Button variant="outline" />}>
                                Cancel
                              </DialogClose>
                              <Button type="submit" disabled={loading}>
                                {loading ? 'Adding...' : 'Add User'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {mosque.users.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No users assigned to this mosque.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {mosque.users.map((user) => (
                          <div
                            key={user.id}
                            className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${user.banned ? 'border-destructive/30 bg-destructive/5' : ''}`}
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{user.name}</span>
                                {user.banned && (
                                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                                    Banned
                                  </span>
                                )}
                              </div>
                              <span className="text-muted-foreground">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(mosque.id, user.id, e.target.value)}
                                disabled={loading}
                                className="flex h-6 rounded-lg border border-input bg-transparent px-1.5 text-xs font-medium transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                              >
                                <option value="admin">admin</option>
                                <option value="viewer">viewer</option>
                              </select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResetPassword(user.id)}
                                disabled={loading}
                                title="Reset password"
                              >
                                <KeyRound className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleBan(user.id, user.name, user.banned)}
                                disabled={loading}
                                title={user.banned ? 'Unban user' : 'Ban user'}
                                className={user.banned ? 'text-green-600 hover:text-green-600' : 'text-destructive hover:text-destructive'}
                              >
                                {user.banned ? <ShieldCheck className="size-4" /> : <Ban className="size-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleRemoveUser(mosque.id, user.id, user.name)}
                                disabled={loading}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={!!tempPassword} onOpenChange={(open) => { if (!open) setTempPassword(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporary Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Share this temporary password with the user. They should change it after logging in.
            </p>
            <code className="block rounded-md bg-muted px-3 py-2 text-sm font-mono">
              {tempPassword}
            </code>
          </div>
          <DialogFooter>
            <Button onClick={() => { navigator.clipboard.writeText(tempPassword ?? ''); setTempPassword(null) }}>
              Copy &amp; Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
