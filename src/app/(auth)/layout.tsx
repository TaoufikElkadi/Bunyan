import Image from "next/image"
import Link from "next/link"
import { AuthTopLink } from "./auth-top-link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#f8f7f5]">
      {/* Left: form side */}
      <div className="relative flex w-full flex-col lg:w-1/2">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 pt-8">
          <Link
            href="/"
            className="flex items-center gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#345e7d] shadow-sm overflow-hidden">
              <Image src="/logos/logo_transparent.svg" alt="" width={24} height={24} className="h-6 w-6" />
            </div>
            <span
              className="text-[18px] font-[584] tracking-[-0.36px] text-[#261b07] uppercase"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              bunyan
            </span>
          </Link>
          <AuthTopLink />
        </div>

        {/* Center form */}
        <div className="flex flex-1 items-center justify-center px-8">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-8 pb-8">
          <p className="text-[13px] text-[#a09888] max-w-[220px] leading-snug">
            Het platform voor donatiebeheer, fondsen en ANBI-rapportage.
          </p>
          <p className="text-[13px] text-[#a09888]">
            &copy; 2026 Bunyan. Alle rechten voorbehouden.
          </p>
        </div>
      </div>

      {/* Right: decorative panel */}
      <div className="hidden lg:block w-1/2 bg-[#edeae4] p-6">
        <div className="h-full w-full rounded-[20px] bg-[#ddd9d0] overflow-hidden relative">
          <DashboardDecoration />
        </div>
      </div>
    </div>
  )
}

function DashboardDecoration() {
  const sidebarItems = [
    { icon: "home", active: false },
    { icon: "chart", active: false },
    { icon: "doc", active: true },
    { icon: "doc", active: false },
    { icon: "list", active: false },
    { icon: "list", active: false },
    { icon: "grid", active: false },
    { icon: "dot", active: false },
    { icon: "gear", active: false },
    { icon: "bolt", active: false },
    { icon: "link", active: false },
    { icon: "flag", active: false },
    { icon: "box", active: false },
    { icon: "star", active: false },
    { icon: "edit", active: false },
    { icon: "circle-g", active: false },
    { icon: "circle-b", active: false },
  ]

  const rows = [
    { w1: "60%", w2: "40%", tag: null },
    { w1: "55%", w2: "45%", tag: null },
    { w1: "70%", w2: "30%", tag: "#e8f0d4" },
    { w1: "50%", w2: "35%", tag: "#fef3c7" },
    { w1: "65%", w2: "30%", tag: null },
    { w1: "60%", w2: "35%", tag: "#fef3c7" },
    { w1: "45%", w2: "50%", tag: "#e8f0d4" },
    { w1: "55%", w2: "40%", tag: "#dbe4f0" },
    { w1: "70%", w2: "30%", tag: null },
    { w1: "50%", w2: "40%", tag: "#fde8d8" },
    { w1: "60%", w2: "35%", tag: "#fde8d8" },
    { w1: "65%", w2: "30%", tag: "#fef3c7" },
  ]

  return (
    <div className="absolute inset-4 flex">
      {/* Sidebar skeleton */}
      <div className="w-[52px] flex flex-col items-center pt-6 gap-4 flex-shrink-0">
        {/* Logo placeholder */}
        <div className="w-7 h-7 rounded-lg bg-[#345e7d]/20 mb-2 overflow-hidden flex items-center justify-center">
          <Image src="/logos/logo_transparent.svg" alt="" width={18} height={18} className="h-[18px] w-[18px] opacity-40" />
        </div>
        {sidebarItems.map((item, i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded flex-shrink-0 ${
              item.active ? "bg-[#261b07]/25" : "bg-[#261b07]/8"
            }`}
          />
        ))}
      </div>

      {/* Main content area */}
      <div className="flex-1 bg-white/60 rounded-xl ml-2 p-5 overflow-hidden">
        {/* Top bar skeleton */}
        <div className="flex items-center gap-3 mb-6">
          <div className="font-semibold text-[14px] text-[#261b07]/30"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            bunyan
          </div>
          <div className="flex-1" />
          <div className="w-5 h-5 rounded bg-[#261b07]/8" />
          <div className="w-5 h-5 rounded bg-[#261b07]/8" />
          <div className="w-[80px] h-3 rounded-full bg-[#261b07]/6" />
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#261b07]/8">
          <div className="w-5 h-5 rounded bg-[#261b07]/8" />
          <div className="flex gap-2">
            <div className="w-[70px] h-6 rounded-md bg-[#261b07]/10" />
            <div className="w-[60px] h-6 rounded-md bg-[#261b07]/5" />
            <div className="w-[50px] h-6 rounded-md bg-[#261b07]/5" />
          </div>
          <div className="flex-1" />
          <div className="w-4 h-4 rounded bg-[#261b07]/6" />
        </div>

        {/* Table rows */}
        <div className="space-y-0">
          {rows.map((row, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 py-2.5 border-b border-[#261b07]/5 ${
                i === 2 ? "bg-[#f9a600]/8 -mx-2 px-2 rounded" : ""
              }`}
            >
              <div className="w-5 h-5 rounded flex-shrink-0 bg-[#261b07]/8" />
              <div className="h-2.5 rounded-full bg-[#261b07]/10" style={{ width: row.w1 }} />
              <div className="flex-1" />
              <div className="h-2.5 rounded-full bg-[#261b07]/6" style={{ width: row.w2 }} />
              {row.tag && (
                <div
                  className="h-5 w-[52px] rounded-md flex-shrink-0"
                  style={{ backgroundColor: row.tag }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
