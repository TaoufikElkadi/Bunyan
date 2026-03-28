'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { UserRole } from '@/types'
import { Loader2Icon, UserPlusIcon } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status?: string
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Beheerder',
  viewer: 'Alleen lezen',
}

const ROLE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  viewer: 'outline',
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Props {
  currentUserId: string
  isAdmin: boolean
}

export function TeamManagement({ currentUserId, isAdmin }: Props) {
  const { data, error, isLoading, mutate } = useSWR<{ members: TeamMember[] } | TeamMember[]>(
    '/api/settings/team',
    fetcher
  )

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [removeLoading, setRemoveLoading] = useState<string | null>(null)

  // Handle both response shapes: { members: [...] } and [...]
  const rawData = data
  const members: TeamMember[] = Array.isArray(rawData) ? rawData : rawData?.members ?? []

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteLoading(true)

    try {
      const res = await fetch('/api/settings/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
        }),
      })

      let result
      try {
        result = await res.json()
      } catch {
        toast.error('Onverwacht antwoord van server')
        return
      }

      if (!res.ok) {
        toast.error(result.error || 'Uitnodiging mislukt')
        return
      }

      if (result.email_sent === false) {
        toast.warning(`${inviteName} is toegevoegd maar de uitnodigings-e-mail kon niet worden verstuurd`)
      } else {
        toast.success(`${inviteName} is uitgenodigd`)
      }
      setInviteEmail('')
      setInviteName('')
      setInviteRole('viewer')
      setInviteOpen(false)
      mutate()
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setInviteLoading(false)
    }
  }

  async function handleRemove(memberId: string, memberName: string) {
    if (!confirm(`Weet u zeker dat u ${memberName} wilt verwijderen uit het team?`)) {
      return
    }

    setRemoveLoading(memberId)

    try {
      const res = await fetch(`/api/settings/team/${memberId}`, {
        method: 'DELETE',
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Verwijderen mislukt')
        setRemoveLoading(null)
        return
      }

      toast.success(`${memberName} verwijderd`)
      mutate()
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setRemoveLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Teamleden</CardTitle>
            <CardDescription>
              Beheer wie toegang heeft tot het dashboard.
            </CardDescription>
          </div>
          {isAdmin && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger render={<Button size="sm" />}>
                <UserPlusIcon className="size-3" />
                Uitnodigen
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleInvite}>
                  <DialogHeader>
                    <DialogTitle>Teamlid uitnodigen</DialogTitle>
                    <DialogDescription>
                      Nodig een bestuurslid uit om toegang te krijgen tot het dashboard.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-name">Naam</Label>
                      <Input
                        id="invite-name"
                        type="text"
                        placeholder="Volledige naam"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        required
                        minLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">E-mailadres</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="naam@email.nl"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-role">Rol</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(val) => setInviteRole(val as UserRole)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            Beheerder — Volledige toegang
                          </SelectItem>
                          <SelectItem value="viewer">
                            Alleen lezen — Bekijken zonder bewerken
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={inviteLoading}>
                      {inviteLoading && <Loader2Icon className="size-3 animate-spin" />}
                      {inviteLoading ? 'Bezig...' : 'Uitnodiging versturen'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-destructive py-4">
            Fout bij ophalen teamleden
          </p>
        )}

        {!isLoading && !error && members.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Geen teamleden gevonden.
          </p>
        )}

        {!isLoading && members.length > 0 && (
          <div className="divide-y">
            {members.map((member) => {
              const isSelf = member.id === currentUserId
              return (
                <div key={member.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      {isSelf && (
                        <span className="text-xs text-muted-foreground">(u)</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={ROLE_BADGE_VARIANT[member.role] ?? 'outline'}>
                      {ROLE_LABELS[member.role] ?? member.role}
                    </Badge>
                    {isAdmin && !isSelf && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemove(member.id, member.name)}
                        disabled={removeLoading === member.id}
                      >
                        {removeLoading === member.id ? (
                          <Loader2Icon className="size-3 animate-spin" />
                        ) : (
                          'Verwijderen'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
