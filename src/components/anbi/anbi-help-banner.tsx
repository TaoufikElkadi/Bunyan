"use client";

import { useState } from "react";
import { InfoIcon, ChevronDownIcon } from "lucide-react";

export function AnbiHelpBanner() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
      >
        <InfoIcon className="size-4 shrink-0 text-blue-600" />
        <span className="flex-1 text-[13px] font-medium text-blue-800">
          Wat moet ik weten over ANBI?
        </span>
        <ChevronDownIcon
          className={`size-4 shrink-0 text-blue-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-blue-100 px-4 py-3 text-[13px] leading-relaxed text-blue-800 space-y-2">
          <p>
            ANBI-giftenverklaringen zijn jaarlijkse overzichten waarmee
            donateurs hun giften kunnen aftrekken van de inkomstenbelasting.
          </p>
          <p>
            <span className="font-semibold">Gewone giften:</span> aftrekbaar
            boven een drempel van 1% van het drempelinkomen (minimaal &euro;60).
          </p>
          <p>
            <span className="font-semibold">Periodieke giften (5+ jaar):</span>{" "}
            volledig aftrekbaar, zonder drempelbedrag. De overeenkomst moet
            minimaal 5 jaar lopen.
          </p>
        </div>
      )}
    </div>
  );
}
