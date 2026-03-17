import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getCachedProfile } from '@/lib/supabase/cached'
import Link from 'next/link'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, supabase } = await getCachedProfile()

  if (!user) {
    redirect('/login')
  }

  // If user already has a profile, they've completed onboarding
  if (profile) {
    redirect('/dashboard')
  }

  const { data: { user: authUser } } = await supabase.auth.getUser()
  const userName = authUser?.user_metadata?.name ?? authUser?.email ?? ''
  const initial = userName.charAt(0).toUpperCase() || '?'

  return (
    <div className="flex min-h-dvh flex-col bg-[#f8f7f5]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 sm:px-8 sm:pt-6">
        <Link
          href="/"
          className="flex items-center gap-2.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#345e7d] shadow-sm overflow-hidden">
            <Image src="/logos/logo_transparent.svg" alt="" width={24} height={24} className="h-6 w-6" />
          </div>
          <span
            className="text-[18px] font-[584] tracking-[-0.36px] text-[#261b07] uppercase"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            bunyan
          </span>
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edeae4] text-[12px] font-medium text-[#a09888]">
          {initial}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-start sm:items-center justify-center px-5 sm:px-6 pt-4 sm:pt-0">
        {children}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-center gap-6 px-4 pb-4 sm:px-8 sm:pb-6">
        <a href="#" className="text-[13px] text-[#b5b0a5] hover:text-[#8a8478] transition-colors">Voorwaarden</a>
        <a href="#" className="text-[13px] text-[#b5b0a5] hover:text-[#8a8478] transition-colors">Privacy</a>
      </div>
    </div>
  )
}
