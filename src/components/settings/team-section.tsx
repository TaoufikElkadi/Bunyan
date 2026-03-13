'use client'

import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { User } from '@/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function TeamSection() {
  const { data: members, isLoading } = useSWR<User[]>('/api/settings/team', fetcher)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teamleden</CardTitle>
        <CardDescription>Gebruikers met toegang tot dit dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : !members?.length ? (
          <p className="text-sm text-muted-foreground">Geen teamleden gevonden.</p>
        ) : (
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                    {member.role === 'admin' ? 'Admin' : 'Viewer'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(member.created_at).toLocaleDateString('nl-NL')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
