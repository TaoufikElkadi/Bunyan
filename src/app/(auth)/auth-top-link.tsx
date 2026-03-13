"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function AuthTopLink() {
  const pathname = usePathname()
  const isLogin = pathname === "/login"

  return (
    <Link
      href={isLogin ? "/signup" : "/login"}
      className="rounded-full border border-[#e3dfd5] px-5 py-2 text-[14px] font-medium text-[#261b07] hover:bg-[#edeae4] transition-colors"
    >
      {isLogin ? "Account aanmaken" : "Inloggen"}
    </Link>
  )
}
