"use client";

import { MosqueDetailsCard } from "@/components/settings/mosque-details-card";
import { BrandingCard } from "@/components/settings/branding-card";
import { StripeCard } from "@/components/settings/stripe-card";
import { AnbiCard } from "@/components/settings/anbi-card";
import { TeamManagement } from "@/components/settings/team-management";
import { PlanCard } from "@/components/settings/plan-card";
import { DangerZoneCard } from "@/components/settings/danger-zone-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Mosque } from "@/types";

interface Props {
  mosque: Mosque;
  userId: string;
  userRole: string;
  hasStripeKey: boolean;
}

export function SettingsClient({
  mosque,
  userId,
  userRole,
  hasStripeKey,
}: Props) {
  const isAdmin = userRole === "admin";

  return (
    <Tabs defaultValue="algemeen">
      <div
        className="-mx-1 overflow-x-auto scrollbar-none"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <TabsList
          variant="line"
          className="w-max sm:w-full justify-start gap-1 sm:gap-2 border-b border-border pb-px"
        >
          <TabsTrigger
            value="algemeen"
            className="px-2.5 sm:px-3 py-2 text-[13px] sm:text-sm"
          >
            Algemeen
          </TabsTrigger>
          <TabsTrigger
            value="huisstijl"
            className="px-2.5 sm:px-3 py-2 text-[13px] sm:text-sm"
          >
            Huisstijl
          </TabsTrigger>
          <TabsTrigger
            value="anbi"
            className="px-2.5 sm:px-3 py-2 text-[13px] sm:text-sm"
          >
            ANBI
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="px-2.5 sm:px-3 py-2 text-[13px] sm:text-sm"
          >
            Team
          </TabsTrigger>
          <TabsTrigger
            value="betalingen"
            className="px-2.5 sm:px-3 py-2 text-[13px] sm:text-sm"
          >
            Betalingen
          </TabsTrigger>
          <TabsTrigger
            value="abonnement"
            className="px-2.5 sm:px-3 py-2 text-[13px] sm:text-sm"
          >
            Abonnement
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="mt-6">
        <TabsContent value="algemeen">
          <div className="max-w-2xl space-y-6">
            <MosqueDetailsCard mosque={mosque} isAdmin={isAdmin} />
          </div>
        </TabsContent>

        <TabsContent value="huisstijl">
          <div className="max-w-2xl space-y-6">
            <BrandingCard mosque={mosque} isAdmin={isAdmin} />
          </div>
        </TabsContent>

        <TabsContent value="anbi">
          <div className="max-w-2xl space-y-6">
            <AnbiCard mosque={mosque} isAdmin={isAdmin} />
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="max-w-3xl space-y-6">
            <TeamManagement currentUserId={userId} isAdmin={isAdmin} />
          </div>
        </TabsContent>

        <TabsContent value="betalingen">
          <div className="max-w-2xl space-y-6">
            <StripeCard
              mosque={mosque}
              hasStripeKey={hasStripeKey}
              isAdmin={isAdmin}
            />
          </div>
        </TabsContent>

        <TabsContent value="abonnement">
          <div className="max-w-2xl space-y-6">
            <PlanCard mosque={mosque} />
            {isAdmin && <DangerZoneCard mosque={mosque} />}
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
