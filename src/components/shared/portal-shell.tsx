/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar, type NavGroup, type NavItem } from "@/components/shared/app-sidebar";
import { BottomTabBar } from "@/components/shared/bottom-tab-bar";
import { OpherixLogo } from "@/components/shared/opherix-logo";
import { PushPermission } from "@/components/shared/push-permission";
import { TopbarSearch } from "@/components/shared/topbar-search";
import { NotificationBell } from "@/components/shared/notification-bell";
import { UserMenu } from "@/components/shared/user-menu";

interface PortalShellProps {
  portalName: string;
  navGroups: NavGroup[];
  /**
   * Hrefs (máx. 4) que van como accesos directos en la barra de navegación
   * inferior de mobile, en el orden en que deben aparecer. El resto de
   * `navGroups` queda disponible ahí mismo bajo el botón "Más".
   */
  primaryNavHrefs: string[];
  user: { name: string; email: string; image?: string };
  notificationsHref?: string;
  notificationCount?: number;
  profileHref?: string;
  breadcrumb?: React.ReactNode;
  children: React.ReactNode;
}

export function PortalShell({
  portalName,
  navGroups,
  primaryNavHrefs,
  user,
  notificationsHref,
  notificationCount = 0,
  profileHref,
  breadcrumb,
  children,
}: PortalShellProps) {
  const allItems = navGroups.flatMap((g) => g.items);
  const primaryItems = primaryNavHrefs
    .map((href) => allItems.find((item) => item.href === href))
    .filter((item): item is NavItem => Boolean(item));
  const moreGroups: NavGroup[] = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !primaryNavHrefs.includes(item.href)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <SidebarProvider>
      <PushPermission />
      <AppSidebar portalName={portalName} navGroups={navGroups} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-transparent bg-sidebar px-4 text-sidebar-foreground md:border-border md:bg-transparent md:px-6 md:text-foreground">
          <SidebarTrigger className="-ml-1 hidden md:inline-flex" />
          <Separator orientation="vertical" className="mr-1 hidden h-5 md:block" />
          <div className="flex items-center gap-2 md:hidden">
            <OpherixLogo size={28} />
            <span className="text-base font-semibold text-white">Opherix</span>
          </div>
          {breadcrumb}
          <TopbarSearch />
          <div className="ml-auto flex items-center gap-1">
            {notificationsHref ? (
              <>
                <NotificationBell href={notificationsHref} count={notificationCount} />
                <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />
              </>
            ) : null}
            <UserMenu
              name={user.name}
              email={user.email}
              image={user.image}
              roleLabel={portalName}
              profileHref={profileHref}
            />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pb-20 md:p-6 md:pb-6">{children}</div>
        <footer className="py-4 text-center text-xs text-muted-foreground pb-20 md:pb-4">
          © {new Date().getFullYear()} Opherix. Desarrollado por Cristhian Prestán.
        </footer>
      </SidebarInset>
      <BottomTabBar primaryItems={primaryItems} moreGroups={moreGroups} />
    </SidebarProvider>
  );
}
