import { redirect } from 'next/navigation'
import { getPlatformAdmin } from '@/lib/supabase/platform-admin'
import { SignOutButton } from './sign-out-button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getPlatformAdmin()

  if (!admin) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Bunyan Platform Admin</h1>
        <SignOutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
