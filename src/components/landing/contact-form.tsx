"use client";

import { useState } from "react";

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Verzenden mislukt.");
      }

      setStatus("sent");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Er ging iets mis.");
    }
  }

  const inputClass =
    "w-full rounded-[8px] border border-[#dddad3] bg-white px-4 py-3 text-[14px] text-[#1a1510] placeholder:text-[color:rgba(26,21,16,0.35)] outline-none focus:border-[#261b07] focus:ring-1 focus:ring-[#261b07] transition-colors";

  return (
    <section id="contact" className="relative py-28 sm:py-40 bg-[#f8f7f5]">
      <div className="mx-auto max-w-[1040px] px-6 sm:px-[30px]">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 lg:gap-20 items-start">
          {/* Left: text */}
          <div>
            <h2
              className="text-[32px] sm:text-[48px] md:text-[56px] font-[380] leading-[1.08] tracking-[-1.5px] text-[#1a1510] mb-5"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Neem contact op
            </h2>
            <p className="text-[15px] leading-[1.65] text-[color:rgba(26,21,16,0.6)] mb-8 max-w-[380px]">
              Heeft u vragen over Bunyan, wilt u een demo of overweegt u het
              Compleet-pakket? Laat een bericht achter en we reageren binnen één
              werkdag.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[14px] text-[color:rgba(26,21,16,0.6)]">
                <svg
                  className="w-5 h-5 flex-shrink-0 text-[#261b07]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13 2 4" />
                </svg>
                info@bunyan.nl
              </div>
              <div className="flex items-center gap-3 text-[14px] text-[color:rgba(26,21,16,0.6)]">
                <svg
                  className="w-5 h-5 flex-shrink-0 text-[#261b07]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                Nederland
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div>
            {status === "sent" ? (
              <div className="rounded-[14px] border border-[#c6e535] bg-[#c6e535]/10 p-10 text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-[#4a6600]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l2.5 2.5L16 9" />
                </svg>
                <h3
                  className="text-[22px] font-[584] tracking-[-0.36px] text-[#1a1510] mb-2"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  Bericht verzonden
                </h3>
                <p className="text-[14px] text-[color:rgba(26,21,16,0.6)]">
                  Bedankt voor uw bericht. We nemen zo snel mogelijk contact met
                  u op.
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-6 text-[13px] font-medium text-[#261b07] underline underline-offset-2 hover:opacity-70 transition-opacity"
                >
                  Nog een bericht sturen
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-[12px] font-semibold tracking-[0.4px] uppercase text-[color:rgba(26,21,16,0.45)] mb-2"
                    >
                      Naam <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Uw volledige naam"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-[12px] font-semibold tracking-[0.4px] uppercase text-[color:rgba(26,21,16,0.45)] mb-2"
                    >
                      E-mailadres <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="naam@voorbeeld.nl"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-phone"
                    className="block text-[12px] font-semibold tracking-[0.4px] uppercase text-[color:rgba(26,21,16,0.45)] mb-2"
                  >
                    Telefoonnummer
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="+31 6 12345678"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-[12px] font-semibold tracking-[0.4px] uppercase text-[color:rgba(26,21,16,0.45)] mb-2"
                  >
                    Bericht <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    placeholder="Vertel ons hoe we u kunnen helpen..."
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {status === "error" && (
                  <p className="text-[13px] text-red-600">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="inline-flex items-center justify-center rounded-[8px] bg-[#261b07] px-7 py-3 text-[14px] font-semibold text-[#f8f7f5] hover:bg-[#3a2c14] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "sending" ? "Verzenden..." : "Verstuur bericht"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
