"use client";

import { useState } from "react";
import { XIcon, Sparkles } from "lucide-react";

interface UpgradeBannerProps {
  message: string;
  plan: string;
}

const DISMISS_KEY = "bunyan_upgrade_banner_dismissed";

export function UpgradeBanner({ message, plan }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(DISMISS_KEY) === "true";
  });

  if (plan !== "free" || dismissed) return null;

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  }

  return (
    <div className="relative rounded-xl border border-[#f9a600]/30 bg-[#f9a600]/8 px-5 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f9a600]/15 mt-0.5">
          <Sparkles className="h-4 w-4 text-[#f9a600]" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#261b07]">
            Upgrade uw abonnement
          </p>
          <p className="text-[13px] text-[#8a8478] mt-0.5">{message}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex h-10 w-10 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-md text-[#a09888] hover:bg-[#261b07]/5 hover:text-[#261b07] transition-colors"
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Sluiten</span>
        </button>
      </div>
    </div>
  );
}
