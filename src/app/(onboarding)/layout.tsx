import { redirect } from 'next/navigation'
import { getCachedProfile } from '@/lib/supabase/cached'
import Link from 'next/link'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await getCachedProfile()

  if (!user) {
    redirect('/login')
  }

  // If user already has a profile, they've completed onboarding
  if (profile) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f7f5]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 pt-6">
        <Link
          href="/"
          className="text-[18px] font-[584] tracking-[-0.36px] text-[#261b07] uppercase"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          bunyan
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edeae4] text-[12px] font-medium text-[#a09888]">
          U
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-4">
        {children}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-center gap-6 px-8 pb-6">
        <a href="#" className="text-[13px] text-[#b5b0a5] hover:text-[#8a8478] transition-colors">Voorwaarden</a>
        <a href="#" className="text-[13px] text-[#b5b0a5] hover:text-[#8a8478] transition-colors">Privacy</a>
      </div>
    </div>
  )
}
