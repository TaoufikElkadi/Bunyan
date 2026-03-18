import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getPlatformAdmin } from '@/lib/supabase/platform-admin'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from './admin-sidebar'

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

  return (
    <div className="flex min-h-screen bg-[#f8f7f5]">
      <AdminSidebar
        userEmail={admin.user.email ?? ''}
        mosqueName={(mosqueProfile?.mosques as any)?.name}
        hasMosqueProfile={!!mosqueProfile}
      />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="mx-auto max-w-[1200px] p-6 md:p-8 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  )
}
