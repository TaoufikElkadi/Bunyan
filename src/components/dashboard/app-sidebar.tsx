'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  HandCoins,
  Users,
  Landmark,
  Megaphone,
  QrCode,
  FileText,
  Settings,
  ClipboardList,
  PanelLeft,
  ChevronRight,
  Shield,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import type { LucideIcon } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Navigation structure                                               */
/* ------------------------------------------------------------------ */

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  adminOnly?: boolean
}

interface NavSection {
  label: string
  items: NavItem[]
  adminOnly?: boolean
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'OVERZICHT',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'BEHEER',
    items: [
      { title: 'Donaties', href: '/donaties', icon: HandCoins },
      { title: 'Donateurs', href: '/donateurs', icon: Users },
      { title: 'Fondsen', href: '/fondsen', icon: Landmark },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { title: 'Campagnes', href: '/campagnes', icon: Megaphone },
      { title: 'QR Codes', href: '/qr', icon: QrCode },
    ],
  },
  {
    label: 'ADMINISTRATIE',
    adminOnly: true,
    items: [
      { title: 'ANBI', href: '/anbi', icon: FileText, adminOnly: true },
      { title: 'Instellingen', href: '/instellingen', icon: Settings, adminOnly: true },
      { title: 'Activiteitenlog', href: '/audit', icon: ClipboardList, adminOnly: true },
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  Role badge                                                         */
/* ------------------------------------------------------------------ */

function RoleBadge({ role }: { role: string }) {
  const label = role === 'admin' ? 'Admin' : role === 'viewer' ? 'Viewer' : 'Lid'
  return (
    <span className="inline-flex items-center rounded-full bg-[#f9a600]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#261b07]/60">
      {label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Sidebar component                                                  */
/* ------------------------------------------------------------------ */

interface AppSidebarProps {
  user: { name: string; email: string; role: string }
  mosque: { name: string; slug: string; plan: string }
  isPlatformAdmin?: boolean
}

export function AppSidebar({ user, mosque, isPlatformAdmin }: AppSidebarProps) {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()

  async function switchToAdmin() {
    await fetch('/api/switch-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'admin' }),
    })
    window.location.href = '/admin'
  }

  return (
    <Sidebar className="border-r border-[#e3dfd5] bg-[#fafaf8]">
      {/* ---- Header ---- */}
      <SidebarHeader className="border-b border-[#e3dfd5] px-5 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#345e7d] shadow-sm overflow-hidden">
              <Image src="/logos/logo_transparent.svg" alt="Bunyan" width={24} height={24} className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[15px] font-bold tracking-tight text-[#261b07]">
                Bunyan
              </span>
              <p className="truncate text-[11px] text-[#8a8478] font-medium leading-tight">{mosque.name}</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#8a8478] hover:bg-[#e3dfd5]/50 hover:text-[#261b07] transition-colors duration-150"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>
      </SidebarHeader>

      {/* ---- Navigation ---- */}
      <SidebarContent className="px-3 py-4">
        {NAV_SECTIONS
          .filter((section) => !section.adminOnly || user.role === 'admin')
          .map((section, idx) => {
            const visibleItems = section.items.filter(
              (item) => !item.adminOnly || user.role === 'admin',
            )
            if (visibleItems.length === 0) return null

            return (
              <SidebarGroup key={`${section.label}-${idx}`} className="mb-1">
                <SidebarGroupLabel className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a09888]">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname.startsWith(item.href)

                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            render={<Link href={item.href} />}
                            isActive={isActive}
                            className={`relative rounded-lg px-3 py-2 transition-all duration-150 ${
                              isActive
                                ? 'bg-[#f9a600]/12 text-[#261b07] font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-full before:bg-[#f9a600]'
                                : 'text-[#8a8478] hover:bg-[#e3dfd5]/40 hover:text-[#261b07]'
                            }`}
                          >
                            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                            <span className="text-[13px]">{item.title}</span>
                            {isActive && (
                              <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#a09888]" />
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
          })}
      </SidebarContent>

      {/* ---- Footer ---- */}
      <SidebarFooter className="border-t border-[#e3dfd5] px-5 py-4">
        {isPlatformAdmin && (
          <button
            onClick={switchToAdmin}
            className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#e3dfd5] bg-white px-3 py-2 text-[12px] font-medium text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors"
          >
            <Shield className="h-3.5 w-3.5" strokeWidth={1.5} />
            Platform Admin
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#261b07] text-[11px] font-semibold uppercase text-[#f8f7f5]">
            {user.name?.charAt(0) || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-[#261b07]">
                {user.name}
              </p>
              <RoleBadge role={user.role} />
            </div>
            <p className="truncate text-[11px] text-[#a09888]">{user.email}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
