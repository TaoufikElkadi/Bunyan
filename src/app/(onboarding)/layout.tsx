import { redirect } from 'next/navigation'
import { getCachedProfile } from '@/lib/supabase/cached'

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
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
