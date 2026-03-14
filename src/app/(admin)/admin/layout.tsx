import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getPlatformAdmin } from '@/lib/supabase/platform-admin'
import { SignOutButton } from './sign-out-button'
import { Shield } from 'lucide-react'

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
    <div className="min-h-screen bg-[#f8f7f5]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e3dfd5] bg-[#fafaf8]/90 backdrop-blur-xl px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#345e7d] shadow-sm overflow-hidden">
            <Image src="/logos/logo_transparent.svg" alt="Bunyan" width={24} height={24} className="h-6 w-6" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold tracking-tight text-[#261b07]">Bunyan</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f9a600]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#261b07]/70">
              <Shield className="h-3 w-3" />
              Platform Admin
            </span>
          </div>
        </div>
        <SignOutButton />
      </header>
      <main className="mx-auto max-w-6xl p-6 md:p-8">{children}</main>
    </div>
  )
}
