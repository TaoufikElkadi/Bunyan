"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?redirect=/set-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div>
        <h1
          className="text-[28px] font-[584] tracking-[-0.56px] text-[#261b07] mb-2"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Controleer uw e-mail
        </h1>
        <p className="text-[15px] text-[#a09888] mb-8">
          Als er een account bestaat voor{" "}
          <strong className="text-[#261b07]">{email}</strong>, ontvangt u een
          e-mail met een link om uw wachtwoord te resetten.
        </p>

        <Link
          href="/login"
          className="block w-full rounded-lg bg-[#261b07] py-3 text-center text-[14px] font-semibold text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors"
        >
          Terug naar inloggen
        </Link>

        <p className="mt-4 text-center text-[13px] text-[#a09888]">
          Geen e-mail ontvangen?{" "}
          <button
            onClick={() => setSent(false)}
            className="text-[#261b07] underline underline-offset-2"
          >
            Opnieuw proberen
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1
        className="text-[28px] font-[584] tracking-[-0.56px] text-[#261b07] mb-2"
        style={{ fontFamily: "var(--font-display), sans-serif" }}
      >
        Wachtwoord vergeten
      </h1>
      <p className="text-[15px] text-[#a09888] mb-8">
        Vul uw e-mailadres in en we sturen u een link om uw wachtwoord te
        resetten.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          inputMode="email"
          placeholder="uw@email.nl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          autoComplete="email"
          autoCapitalize="none"
          className="w-full rounded-lg border border-[#e3dfd5] bg-white px-4 py-3 text-base text-[#261b07] placeholder:text-[#b5b0a5] outline-none focus:border-[#261b07]/30 focus:ring-1 focus:ring-[#261b07]/10 transition-colors"
        />

        {error && <p className="text-[13px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#261b07] py-3.5 text-[15px] font-semibold text-[#f8f7f5] hover:bg-[#3a2c14] disabled:opacity-50 transition-colors"
        >
          {loading ? "Bezig..." : "Resetlink versturen"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-[#a09888]">
        Wachtwoord gevonden?{" "}
        <Link
          href="/login"
          className="text-[#261b07] underline underline-offset-2"
        >
          Inloggen
        </Link>
      </p>
    </div>
  );
}
