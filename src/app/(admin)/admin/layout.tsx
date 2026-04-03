import { redirect } from 'next/navigation'
import { getPlatformAdmin } from '@/lib/supabase/platform-admin'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from './admin-sidebar'
import { AdminMobileHeader } from './admin-mobile-header'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getPlatformAdmin()

  if (!admin) {
    redirect('/dashboard')
  }

  // Check if this admin also has a mosque profile
  const supabase = await createClient()
  const { data: mosqueProfile } = await supabase
    .from('users')
    .select('mosque_id, mosques(name)')
    .eq('id', admin.user.id)
    .single()

  const sidebarProps = {
    userEmail: admin.user.email ?? '',
    mosqueName: (mosqueProfile?.mosques as unknown as { name: string } | null)?.name,
    hasMosqueProfile: !!mosqueProfile,
  }

  return (
    <div className="flex min-h-screen bg-[#f8f7f5]">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AdminSidebar {...sidebarProps} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <AdminMobileHeader {...sidebarProps} />

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1200px] px-4 py-5 md:p-8 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
