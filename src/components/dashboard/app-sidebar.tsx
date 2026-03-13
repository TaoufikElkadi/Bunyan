'use client'

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
  Building2,
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
    label: 'BEHEER',
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
    <span className="inline-flex items-center rounded-full bg-sidebar-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sidebar-foreground/50">
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
}

export function AppSidebar({ user, mosque }: AppSidebarProps) {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      {/* ---- Header ---- */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground shadow-sm">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-sidebar-foreground">
              Bunyan
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground/70 transition-colors duration-150"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 truncate text-xs text-sidebar-foreground/40 font-medium">{mosque.name}</p>
      </SidebarHeader>

      {/* ---- Navigation ---- */}
      <SidebarContent className="px-2 py-3">
        {NAV_SECTIONS
          .filter((section) => !section.adminOnly || user.role === 'admin')
          .map((section, idx) => {
            const visibleItems = section.items.filter(
              (item) => !item.adminOnly || user.role === 'admin',
            )
            if (visibleItems.length === 0) return null

            return (
              <SidebarGroup key={`${section.label}-${idx}`}>
                <SidebarGroupLabel className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/35">
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
                            className={`relative transition-all duration-150 rounded-md ${
                              isActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-[3px] before:rounded-full before:bg-sidebar-primary'
                                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground/90'
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.title}</span>
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
      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 text-[11px] font-semibold uppercase text-sidebar-primary-foreground shadow-sm">
            {user.name?.charAt(0) || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user.name}
              </p>
              <RoleBadge role={user.role} />
            </div>
            <p className="truncate text-xs text-sidebar-foreground/40">{user.email}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
