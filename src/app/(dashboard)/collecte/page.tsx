import { getCachedProfile } from "@/lib/supabase/cached";
import { CollectionForm } from "@/components/donation/collection-form";

export const revalidate = 60;

export default async function CollectePage() {
  const { mosqueId, supabase } = await getCachedProfile();

  if (!mosqueId) return null;

  const { data: funds } = await supabase
    .from("funds")
    .select("id, name, icon")
    .eq("mosque_id", mosqueId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#261b07]">
          Inzameling registreren
        </h1>
        <p className="text-[14px] text-[#8a8478] mt-1">
          Registreer snel de opbrengst van vrijdaggebed, Ramadan of een ander
          moment.
        </p>
      </div>

      <CollectionForm funds={funds ?? []} />
    </div>
  );
}
