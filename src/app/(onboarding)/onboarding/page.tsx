"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QRCode from "qrcode";
import { Copy, Check } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isValidSlug(slug: string): boolean {
  return slug.length >= 2 && SLUG_REGEX.test(slug);
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 2;

const STEP_LABELS = ["Gegevens", "Live!"];

const DEFAULT_FUNDS = [
  {
    name: "Algemeen",
    description: "Algemene bijdrage aan de moskee",
    icon: "\u{1F54C}",
  },
  {
    name: "Zakat Al-Mal",
    description: "Verplichte jaarlijkse aalmoes",
    icon: "\u{1F48E}",
  },
  {
    name: "Zakat Al-Fitr",
    description: "Zakat voor het einde van Ramadan",
    icon: "\u{1F319}",
  },
];

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://bunyan.nl";

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const inputClass =
  "w-full rounded-lg border border-[#e3dfd5] bg-white px-4 py-3 text-[16px] sm:text-[14px] text-[#261b07] placeholder:text-[#b5b0a5] outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const isCurrent = stepNum === current;
        const isCompleted = stepNum < current;
        return (
          <div
            key={stepNum}
            className={`rounded-full transition-all duration-300 ${
              isCurrent
                ? "w-6 h-2 bg-[#f9a600]"
                : isCompleted
                  ? "w-2 h-2 bg-[#261b07]/30"
                  : "w-2 h-2 bg-[#261b07]/10"
            }`}
          />
        );
      })}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[12px] text-red-600 mt-1">{message}</p>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#e3dfd5] bg-white text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] active:bg-[#f3f1ec] transition-colors"
      aria-label="Kopieer link"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[#4a7c10]" strokeWidth={2} />
      ) : (
        <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Step 1: Basics + ANBI
  const [mosqueName, setMosqueName] = useState("");
  const [city, setCity] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [nameError, setNameError] = useState("");
  const [cityError, setCityError] = useState("");
  const [slugError, setSlugError] = useState("");
  const [anbiStatus, setAnbiStatus] = useState(false);
  const [rsin, setRsin] = useState("");

  // Step 2: Live — generated after submit
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Navigation
  const goTo = useCallback(
    (target: number) => {
      if (isAnimating) return;
      setDirection(target > step ? "forward" : "back");
      setIsAnimating(true);
      setTimeout(() => {
        setStep(target);
        setIsAnimating(false);
      }, 150);
    },
    [step, isAnimating],
  );

  // Step 1 handlers
  function handleNameChange(name: string) {
    setMosqueName(name);
    if (nameError) setNameError("");
    if (!slugTouched) {
      setSlug(slugify(name));
      if (slugError) setSlugError("");
    }
  }

  function handleSlugChange(value: string) {
    setSlug(slugify(value));
    setSlugTouched(true);
    if (slugError) setSlugError("");
  }

  function validateStep1(): boolean {
    let valid = true;
    if (!mosqueName.trim()) {
      setNameError("Vul de naam van uw moskee in");
      valid = false;
    } else if (mosqueName.trim().length < 2) {
      setNameError("Naam moet minimaal 2 tekens bevatten");
      valid = false;
    } else {
      setNameError("");
    }
    if (!city.trim()) {
      setCityError("Vul de stad in");
      valid = false;
    } else {
      setCityError("");
    }
    if (!slug) {
      setSlugError("Vul een URL-slug in");
      valid = false;
    } else if (!isValidSlug(slug)) {
      setSlugError(
        "Alleen kleine letters, cijfers en streepjes. Min. 2 tekens.",
      );
      valid = false;
    } else {
      setSlugError("");
    }
    return valid;
  }

  // Submit — creates mosque, then transitions to step 2
  async function handleComplete() {
    setError(null);
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Niet ingelogd");
      const user = session.user;

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mosque: {
            name: mosqueName,
            slug,
            city,
            primary_color: "#10b981",
            welcome_msg: null,
            anbi_status: anbiStatus,
            rsin: anbiStatus ? rsin : null,
          },
          funds: DEFAULT_FUNDS,
          user: {
            name: user.user_metadata?.name || user.email,
            email: user.email,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Er is iets misgegaan");
      }

      // Generate QR code for the donation page
      const donationUrl = `${APP_URL}/doneren/${slug}`;
      const dataUrl = await QRCode.toDataURL(donationUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#261b07", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);

      setLoading(false);
      goTo(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er is iets misgegaan");
      setLoading(false);
    }
  }

  const donationUrl = `${APP_URL}/doneren/${slug}`;

  // Transition
  const transitionClass = isAnimating
    ? direction === "forward"
      ? "opacity-0 translate-x-4"
      : "opacity-0 -translate-x-4"
    : "opacity-100 translate-x-0";

  return (
    <div className="w-full max-w-[480px] py-4 sm:py-8 pb-8">
      <div
        className={`transition-all duration-300 ease-in-out ${transitionClass}`}
      >
        {/* ================================================================= */}
        {/* STEP 1 — Basics + ANBI                                           */}
        {/* ================================================================= */}
        {step === 1 && (
          <div className="text-center">
            <span className="inline-block rounded-full border border-[#e3dfd5] px-4 py-1 text-[12px] font-medium text-[#8a8478] mb-4">
              {STEP_LABELS[0]}
            </span>

            <h1
              className="text-[24px] font-[584] tracking-[-0.48px] text-[#261b07] mb-1"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Hoe heet uw moskee?
            </h1>
            <p className="text-[14px] text-[#a09888] mb-8">
              De basisinformatie van uw organisatie.
            </p>

            <div className="text-left space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#261b07] mb-1.5">
                  Naam moskee
                </label>
                <input
                  type="text"
                  placeholder="bijv. Stichting Al-Fath"
                  value={mosqueName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
                <FieldError message={nameError} />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#261b07] mb-1.5">
                  Stad
                </label>
                <input
                  type="text"
                  placeholder="bijv. Amsterdam"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (cityError) setCityError("");
                  }}
                  className={inputClass}
                />
                <FieldError message={cityError} />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#261b07] mb-1.5">
                  Hoe wil je dat jouw link eruitziet?
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="uw-moskee"
                  className={inputClass}
                />
                <FieldError message={slugError} />
                {slug && !slugError && (
                  <p className="text-[12px] text-[#a09888] mt-1">
                    Uw donatiepagina:{" "}
                    <span className="font-medium text-[#261b07]">
                      bunyan.nl/doneren/{slug}
                    </span>
                  </p>
                )}
              </div>

              {/* ANBI toggle */}
              <div className="mt-4">
                <label className="flex items-start gap-3.5 cursor-pointer text-left rounded-lg border border-[#e3dfd5] bg-white p-4 transition-colors hover:border-[#d0cbc0]">
                  <div className="pt-0.5">
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        setAnbiStatus(!anbiStatus);
                      }}
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                        anbiStatus
                          ? "bg-[#261b07] border-[#261b07]"
                          : "border-[#d5cfb8] bg-white"
                      }`}
                    >
                      {anbiStatus && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#261b07]">
                      Wij hebben ANBI-status
                    </p>
                    <p className="text-[12px] text-[#a09888] mt-0.5">
                      Donateurs ontvangen automatisch een fiscale jaaropgave
                    </p>
                  </div>
                </label>

                {anbiStatus && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300 text-left">
                    <label className="block text-[13px] font-medium text-[#261b07] mb-1.5">
                      RSIN nummer
                    </label>
                    <input
                      placeholder="123456789"
                      value={rsin}
                      onChange={(e) =>
                        setRsin(e.target.value.replace(/\D/g, "").slice(0, 9))
                      }
                      inputMode="numeric"
                      maxLength={9}
                      className={inputClass}
                    />
                    <p className="text-[12px] text-[#a09888] mt-1">
                      9 cijfers, te vinden op de ANBI-beschikking van de
                      Belastingdienst
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 mt-4">
                <p className="text-[13px] text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={() => {
                if (validateStep1()) handleComplete();
              }}
              disabled={loading}
              className="w-full mt-6 rounded-xl bg-[#261b07] py-3.5 text-[15px] font-semibold text-[#f8f7f5] hover:bg-[#3a2c14] active:bg-[#3a2c14] disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-[#f8f7f5] border-t-transparent animate-spin" />
                  Bezig...
                </span>
              ) : (
                "Moskee aanmaken"
              )}
            </button>

            <StepDots current={1} total={TOTAL_STEPS} />
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2 — "U bent live!" share moment                             */}
        {/* ================================================================= */}
        {step === 2 && (
          <div className="text-center">
            {/* Success icon */}
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f0d4]">
              <svg
                className="w-8 h-8 text-[#6aab35]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1
              className="text-[24px] font-[584] tracking-[-0.48px] text-[#261b07] mb-1"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              {mosqueName} is aangemeld!
            </h1>
            <p className="text-[14px] text-[#a09888] mb-8">
              Wij beoordelen uw aanvraag — meestal binnen 24 uur. U ontvangt
              bericht zodra uw donatiepagina live gaat.
            </p>

            {/* What happens next */}
            <div className="text-left mb-6 space-y-3">
              <div className="flex gap-3 items-start rounded-lg border border-[#e3dfd5] bg-[#fafaf8] p-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f9a600]/15 text-[12px] font-bold text-[#f9a600]">
                  1
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#261b07]">
                    Beoordeling
                  </p>
                  <p className="text-[12px] text-[#a09888] mt-0.5">
                    Wij controleren uw gegevens — meestal binnen 24 uur.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start rounded-lg border border-[#e3dfd5] bg-[#fafaf8] p-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f9a600]/15 text-[12px] font-bold text-[#f9a600]">
                  2
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#261b07]">
                    Goedkeuring
                  </p>
                  <p className="text-[12px] text-[#a09888] mt-0.5">
                    Na goedkeuring wordt uw donatiepagina direct live.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start rounded-lg border border-[#e3dfd5] bg-[#fafaf8] p-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f9a600]/15 text-[12px] font-bold text-[#f9a600]">
                  3
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#261b07]">
                    In de tussentijd
                  </p>
                  <p className="text-[12px] text-[#a09888] mt-0.5">
                    Verken het dashboard, stel fondsen in en bereid alles voor.
                  </p>
                </div>
              </div>
            </div>

            {/* Donation page link (preview — not live yet) */}
            <div className="text-left mb-5">
              <label className="block text-[11px] font-medium text-[#a09888] uppercase tracking-wide mb-1.5">
                Uw toekomstige donatiepagina
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 flex items-center rounded-lg border border-[#e3dfd5] bg-[#fafaf8] px-3.5 py-3">
                  <span className="text-[13px] text-[#261b07] font-medium truncate block overflow-hidden">
                    {donationUrl}
                  </span>
                </div>
                <CopyButton text={donationUrl} />
              </div>
            </div>

            {/* QR code */}
            {qrDataUrl && (
              <div className="mx-auto mb-5 flex flex-col items-center">
                <div className="rounded-xl border border-[#e3dfd5] bg-white p-3 sm:p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="QR code voor donatiepagina"
                    className="w-[150px] h-[150px] sm:w-[180px] sm:h-[180px]"
                  />
                </div>
                <p className="text-[11px] text-[#b5b0a5] mt-2">
                  Bewaar voor later — werkt zodra uw pagina live is
                </p>
              </div>
            )}

            {/* Go to dashboard */}
            <button
              onClick={() => {
                router.push("/dashboard");
                router.refresh();
              }}
              className="w-full mt-2 rounded-xl bg-[#261b07] py-3.5 text-[15px] font-semibold text-[#f8f7f5] hover:bg-[#3a2c14] active:bg-[#3a2c14] transition-colors"
            >
              Ga naar het dashboard
            </button>

            <StepDots current={2} total={TOTAL_STEPS} />
          </div>
        )}
      </div>
    </div>
  );
}
