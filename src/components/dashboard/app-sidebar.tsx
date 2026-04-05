"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Banknote,
  Wallet,
  LifeBuoy,
} from "lucide-react";
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
} from "@/components/ui/sidebar";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Navigation structure                                               */
/* ------------------------------------------------------------------ */

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
  adminOnly?: boolean;
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "OVERZICHT",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "BEHEER",
    items: [
      { title: "Donaties", href: "/donaties", icon: HandCoins },
      { title: "Inzameling", href: "/collecte", icon: Banknote },
      { title: "Contributie", href: "/contributie", icon: Wallet },
      { title: "Dragers", href: "/leden", icon: Users },
      { title: "Fondsen", href: "/fondsen", icon: Landmark },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { title: "Campagnes", href: "/campagnes", icon: Megaphone },
      { title: "QR Codes", href: "/qr", icon: QrCode },
    ],
  },
  {
    label: "ADMINISTRATIE",
    adminOnly: true,
    items: [
      { title: "ANBI", href: "/anbi", icon: FileText, adminOnly: true },
      {
        title: "Instellingen",
        href: "/instellingen",
        icon: Settings,
        adminOnly: true,
      },
      {
        title: "Activiteitenlog",
        href: "/audit",
        icon: ClipboardList,
        adminOnly: true,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Role badge                                                         */
/* ------------------------------------------------------------------ */

function RoleBadge({ role }: { role: string }) {
  const label =
    role === "admin"
      ? "Beheerder"
      : role === "treasurer"
        ? "Penningmeester"
        : role === "viewer"
          ? "Alleen lezen"
          : "Lid";
  return (
    <span className="inline-flex items-center rounded-full bg-[#f9a600]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#261b07]/60">
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar component                                                  */
/* ------------------------------------------------------------------ */

interface AppSidebarProps {
  user: { name: string; email: string; role: string };
  mosque: { name: string; slug: string; plan: string };
  isPlatformAdmin?: boolean;
  pendingSignatures?: number;
}

export function AppSidebar({
  user,
  mosque,
  isPlatformAdmin,
  pendingSignatures = 0,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  async function switchToAdmin() {
    await fetch("/api/switch-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "admin" }),
    });
    window.location.href = "/admin";
  }

  return (
    <Sidebar className="border-r border-[#e3dfd5] bg-[#fafaf8]">
      {/* ---- Header ---- */}
      <SidebarHeader className="border-b border-[#e3dfd5] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#345e7d] shadow-sm overflow-hidden">
              <Image
                src="/logos/logo_transparent.svg"
                alt="Bunyan"
                width={20}
                height={20}
                className="h-5 w-5"
              />
            </div>
            <div>
              <span className="text-[13px] font-bold tracking-tight text-[#261b07]">
                Bunyan
              </span>
              <p className="truncate text-[10px] text-[#8a8478] font-medium leading-tight">
                {mosque.name}
              </p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="flex h-6 w-6 items-center justify-center rounded-md text-[#8a8478] hover:bg-[#e3dfd5]/50 hover:text-[#261b07] transition-colors duration-150"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      </SidebarHeader>

      {/* ---- Navigation ---- */}
      <SidebarContent className="px-2 py-2" data-tour="sidebar-nav">
        {NAV_SECTIONS.filter(
          (section) => !section.adminOnly || user.role === "admin",
        ).map((section, idx) => {
          const visibleItems = section.items.filter(
            (item) => !item.adminOnly || user.role === "admin",
          );
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={`${section.label}-${idx}`} className="mb-0 py-1">
              <SidebarGroupLabel className="mb-0.5 px-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#a09888]">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <SidebarMenuItem
                        key={item.href}
                        {...(item.href === "/instellingen"
                          ? { "data-tour": "sidebar-settings" }
                          : {})}
                      >
                        <SidebarMenuButton
                          render={<Link href={item.href} />}
                          isActive={isActive}
                          className={`relative rounded-md px-2.5 py-1.5 transition-all duration-150 ${
                            isActive
                              ? "bg-[#f9a600]/12 text-[#261b07] font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-[2.5px] before:rounded-full before:bg-[#f9a600]"
                              : "text-[#8a8478] hover:bg-[#e3dfd5]/40 hover:text-[#261b07]"
                          }`}
                        >
                          <Icon
                            className="h-4 w-4 shrink-0"
                            strokeWidth={1.5}
                          />
                          <span className="text-[12px]">{item.title}</span>
                          {item.href === "/anbi" && pendingSignatures > 0 ? (
                            <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-[#261b07] px-1 text-[9px] font-bold text-white">
                              {pendingSignatures}
                            </span>
                          ) : isActive ? (
                            <ChevronRight className="ml-auto h-3 w-3 text-[#a09888]" />
                          ) : null}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* ---- Footer ---- */}
      <SidebarFooter className="border-t border-[#e3dfd5] px-3 py-2.5">
        <a
          href="mailto:info@bunyan.nl"
          className="mb-1.5 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-[#8a8478] hover:bg-[#e3dfd5]/40 hover:text-[#261b07] transition-all duration-150"
        >
          <LifeBuoy className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          Hulp & Support
        </a>
        {isPlatformAdmin && (
          <button
            onClick={switchToAdmin}
            className="mb-1.5 flex w-full items-center justify-center gap-1.5 rounded-md border border-[#e3dfd5] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors"
          >
            <Shield className="h-3 w-3" strokeWidth={1.5} />
            Platform Admin
          </button>
        )}
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#261b07] text-[9px] font-semibold uppercase text-[#f8f7f5]">
            {user.name?.charAt(0) || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[12px] font-medium text-[#261b07]">
                {user.name}
              </p>
              <RoleBadge role={user.role} />
            </div>
            <p className="truncate text-[10px] text-[#a09888]">{user.email}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
