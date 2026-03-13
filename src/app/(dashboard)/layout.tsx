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
  const { user, profile, mosque, isPlatformAdmin } = await getCachedProfile()

  if (!user) {
    redirect('/login')
  }

  if (!profile) {
    // Platform admins don't need a mosque profile — send them to the admin panel
    redirect(isPlatformAdmin ? '/admin' : '/onboarding')
  }

  return (
    <SidebarProvider>
      <AppSidebar user={profile} mosque={mosque} />
      <SidebarInset>
        <DashboardHeader user={profile} mosque={mosque} />
        <main className="flex-1 p-6 md:p-8 bg-background/50">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
