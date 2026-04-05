import { redirect } from "next/navigation";
import { getCachedProfile } from "@/lib/supabase/cached";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { OnboardingTour } from "@/components/dashboard/onboarding-tour";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, mosque, isPlatformAdmin, supabase } =
    await getCachedProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect(isPlatformAdmin ? "/admin" : "/onboarding");
  }

  // Count pending periodic gift agreements for badge
  let pendingSignatures = 0;
  if (profile.role === "admin") {
    const { count } = await supabase
      .from("periodic_gift_agreements")
      .select("id", { count: "exact", head: true })
      .eq("mosque_id", profile.mosque_id)
      .eq("status", "pending_board");
    pendingSignatures = count ?? 0;
  }

  return (
    <div dir="ltr">
      <SidebarProvider>
        <AppSidebar
          user={profile}
          mosque={mosque}
          isPlatformAdmin={isPlatformAdmin}
          pendingSignatures={pendingSignatures}
        />
        <SidebarInset style={{ zoom: 0.85 }}>
          <DashboardHeader user={profile} mosque={mosque} />
          {mosque?.status === "pending" && (
            <div className="mx-6 md:mx-8 mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-[14px] font-medium text-amber-800">
                Uw aanvraag wordt beoordeeld
              </p>
              <p className="text-[13px] text-amber-700 mt-0.5">
                Uw moskee is aangemeld en wacht op goedkeuring. U kunt alvast
                het dashboard verkennen, maar uw donatiepagina is nog niet
                publiek zichtbaar.
              </p>
            </div>
          )}
          {mosque?.status === "rejected" && (
            <div className="mx-6 md:mx-8 mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
              <p className="text-[14px] font-medium text-red-800">
                Aanvraag afgewezen
              </p>
              <p className="text-[13px] text-red-700 mt-0.5">
                Uw aanvraag is helaas afgewezen. Neem contact op met support
                voor meer informatie.
              </p>
            </div>
          )}
          <main className="flex-1 p-4 sm:p-6 md:p-8 bg-[#f8f7f5]">
            {children}
          </main>
        </SidebarInset>
        <OnboardingTour />
      </SidebarProvider>
    </div>
  );
}
