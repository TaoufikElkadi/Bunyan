import { redirect } from 'next/navigation'
import { getCachedProfile } from '@/lib/supabase/cached'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, mosque, isPlatformAdmin, supabase } = await getCachedProfile()

  if (!user) {
    redirect('/login')
  }

  if (!profile) {
    redirect(isPlatformAdmin ? '/admin' : '/onboarding')
  }

  // Count pending periodic gift agreements for badge
  let pendingSignatures = 0
  if (profile.role === 'admin') {
    const { count } = await supabase
      .from('periodic_gift_agreements')
      .select('id', { count: 'exact', head: true })
      .eq('mosque_id', profile.mosque_id)
      .eq('status', 'pending_board')
    pendingSignatures = count ?? 0
  }

  return (
    <SidebarProvider>
      <AppSidebar user={profile} mosque={mosque} isPlatformAdmin={isPlatformAdmin} pendingSignatures={pendingSignatures} />
      <SidebarInset>
        <DashboardHeader user={profile} mosque={mosque} />
        <main className="flex-1 p-6 md:p-8 bg-[#f8f7f5]">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
