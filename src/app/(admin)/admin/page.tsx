import { getPlatformAdmin } from '@/lib/supabase/platform-admin'
import { redirect } from 'next/navigation'
import { AdminDashboard } from './admin-dashboard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const admin = await getPlatformAdmin()
  if (!admin) redirect('/dashboard')

  const { data: mosques, error: mosquesError } = await admin.adminClient
    .from('mosques')
    .select('id, name, slug, city, plan, status, created_at')
    .order('created_at', { ascending: false })

  if (mosquesError) {
    console.error('[Admin] Failed to fetch mosques:', mosquesError)
  }

  const mosqueIds = (mosques ?? []).map((m: { id: string }) => m.id)

  const { data: users } = mosqueIds.length > 0
    ? await admin.adminClient
        .from('users')
        .select('id, name, email, role, mosque_id, created_at')
        .in('mosque_id', mosqueIds)
    : { data: [] }

  // Fetch auth user data for ban status
  const { data: { users: authUsers } } = await admin.adminClient.auth.admin.listUsers()
  const bannedUserIds = new Set(
    (authUsers ?? [])
      .filter((u) => u.banned_until && new Date(u.banned_until) > new Date())
      .map((u) => u.id)
  )

  // Fetch donation metrics
  const { data: allDonations } = await admin.adminClient
    .from('donations')
    .select('amount_cents, created_at')
    .eq('status', 'completed')

  const completedDonations = allDonations ?? []
  const totalDonations = completedDonations.length
  const totalRevenue = completedDonations.reduce((sum: number, d: { amount_cents: number | null; created_at: string }) => sum + (d.amount_cents ?? 0), 0)

  // Monthly revenue: donations created in the current month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthlyRevenue = completedDonations
    .filter((d) => d.created_at >= monthStart)
    .reduce((sum, d) => sum + (d.amount_cents ?? 0), 0)

  const metrics = {
    totalMosques: (mosques ?? []).length,
    totalDonations,
    totalRevenue,
    totalUsers: (users ?? []).length,
    monthlyRevenue,
  }

  // Group users by mosque
  type UserRow = { id: string; name: string; email: string; role: string; mosque_id: string; created_at: string }
  const usersByMosque = (users ?? []).reduce((acc: Record<string, UserRow[]>, u: UserRow) => {
    if (!acc[u.mosque_id]) acc[u.mosque_id] = []
    acc[u.mosque_id].push(u)
    return acc
  }, {} as Record<string, UserRow[]>)

  const mosquesWithUsers = (mosques ?? []).map((m) => ({
    ...m,
    users: (usersByMosque[m.id] ?? []).map((u) => ({
      ...u,
      banned: bannedUserIds.has(u.id),
    })),
  }))

  return <AdminDashboard mosques={mosquesWithUsers} metrics={metrics} />
}
