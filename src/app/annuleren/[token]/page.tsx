import { createAdminClient } from "@/lib/supabase/admin";
import { CancelForm } from "@/components/recurring/cancel-form";

export const metadata = {
  title: "Donatie annuleren — Bunyan",
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function CancelPage({ params }: Props) {
  const { token } = await params;
  const admin = createAdminClient();

  // Look up recurring by cancel_token, join fund and mosque
  const { data: recurring } = await admin
    .from("recurrings")
    .select(
      `
      id,
      amount,
      frequency,
      status,
      cancel_token,
      fund:funds(name),
      mosque:mosques(name)
    `,
    )
    .eq("cancel_token", token)
    .single();

  if (!recurring) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex items-center justify-center px-5">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold mb-4">Niet gevonden</h1>
          <p className="text-muted-foreground">
            Deze annuleringslink is ongeldig of verlopen.
          </p>
        </div>
      </div>
    );
  }

  if (recurring.status === "cancelled") {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex items-center justify-center px-5">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold mb-4">Al geannuleerd</h1>
          <p className="text-muted-foreground">
            Deze terugkerende donatie is al eerder geannuleerd.
          </p>
        </div>
      </div>
    );
  }

  const fundName =
    (recurring.fund as unknown as { name: string })?.name || "Onbekend fonds";
  const mosqueName =
    (recurring.mosque as unknown as { name: string })?.name ||
    "Onbekende moskee";

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50">
      <div className="mx-auto max-w-lg px-5 py-8 sm:py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">{mosqueName}</h1>
        </div>
        <CancelForm
          amount={recurring.amount}
          frequency={recurring.frequency}
          fundName={fundName}
          mosqueName={mosqueName}
          cancelToken={token}
        />
      </div>
    </div>
  );
}
