'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from '@/components/ui/sidebar'

const NAV_ITEMS = [
  { title: 'Dashboard', href: '/dashboard', icon: '📊' },
  { title: 'Donaties', href: '/donaties', icon: '💰' },
  { title: 'Donateurs', href: '/donateurs', icon: '👥' },
  { title: 'Fondsen', href: '/fondsen', icon: '🏦' },
  { title: 'Campagnes', href: '/campagnes', icon: '📢' },
  { title: 'ANBI', href: '/anbi', icon: '📄' },
  { title: 'Instellingen', href: '/instellingen', icon: '⚙️' },
]

interface AppSidebarProps {
  user: { name: string; email: string; role: string }
  mosque: { name: string; slug: string; plan: string }
}

export function AppSidebar({ user, mosque }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">Bunyan</span>
        </div>
        <p className="text-sm text-muted-foreground truncate">{mosque.name}</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigatie</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton render={<Link href={item.href} />} isActive={pathname.startsWith(item.href)}>
                    <span>{item.icon}</span>
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t px-4 py-3">
        <div className="text-sm">
          <p className="font-medium truncate">{user.name}</p>
          <p className="text-muted-foreground truncate">{user.email}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
