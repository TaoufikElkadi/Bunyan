import { getCachedProfile } from "@/lib/supabase/cached";
import { Button } from "@/components/ui/button";
import { CampaignDialog } from "@/components/campaign/campaign-dialog";
import { CampaignCards } from "@/components/campaign/campaign-cards";
import { PlusIcon, Megaphone, Lock } from "lucide-react";
import { getPlanLimits } from "@/lib/plan";

export const revalidate = 60;

export default async function CampagnesPage() {
  const { mosqueId, mosque, supabase, profile } = await getCachedProfile();

  if (!mosqueId) return null;

  const limits = getPlanLimits(mosque?.plan ?? "free");
  if (!limits.hasCampaigns) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">
            Campagnes
          </h1>
          <p className="text-[14px] text-[#8a8478] mt-1">
            Beheer uw donatiecampagnes
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-[#e3dfd5] bg-white">
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="rounded-full bg-[#f3f1ec] p-5 mb-5">
              <Lock className="h-7 w-7 text-[#a09888]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[14px] font-medium text-[#261b07] mb-1.5">
              Upgrade vereist
            </h3>
            <p className="text-[13px] text-[#a09888] text-center max-w-sm leading-relaxed">
              Campagnebeheer is beschikbaar vanaf het Starter-abonnement.
              Upgrade om campagnes te beheren.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const canEdit = profile.role !== "viewer";

  const [{ data: campaigns }, { data: funds }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("*, funds(name)")
      .eq("mosque_id", mosqueId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("funds")
      .select("*")
      .eq("mosque_id", mosqueId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">
            Campagnes
          </h1>
          <p className="text-[14px] text-[#8a8478] mt-1">
            Beheer uw donatiecampagnes
          </p>
        </div>
        {canEdit && funds && funds.length > 0 && (
          <CampaignDialog
            mode="create"
            funds={funds}
            trigger={
              <Button
                size="sm"
                className="bg-[#261b07] text-[#f8f7f5] hover:bg-[#3a2c14]"
              >
                <PlusIcon className="size-4 mr-1" />
                Nieuwe campagne
              </Button>
            }
          />
        )}
      </div>

      {campaigns && campaigns.length > 0 ? (
        <CampaignCards
          campaigns={campaigns}
          funds={funds ?? []}
          mosqueSlug={mosque?.slug ?? ""}
          role={profile.role}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e3dfd5] bg-white py-16">
          <div className="rounded-full bg-[#f3f1ec] p-5 mb-5">
            <Megaphone className="h-7 w-7 text-[#a09888]" strokeWidth={1.5} />
          </div>
          <p className="text-[13px] text-[#8a8478]">Nog geen campagnes.</p>
        </div>
      )}
    </div>
  );
}
