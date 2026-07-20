/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar, type NavGroup } from "@/components/shared/app-sidebar";
import { PushPermission } from "@/components/shared/push-permission";
import { TopbarSearch } from "@/components/shared/topbar-search";
import { NotificationBell } from "@/components/shared/notification-bell";
import { UserMenu } from "@/components/shared/user-menu";

interface PortalShellProps {
  portalName: string;
  navGroups: NavGroup[];
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
  user,
  notificationsHref,
  notificationCount = 0,
  profileHref,
  breadcrumb,
  children,
}: PortalShellProps) {
  return (
    <SidebarProvider>
      <PushPermission />
      <AppSidebar portalName={portalName} navGroups={navGroups} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-5" />
          {breadcrumb}
          <TopbarSearch />
          <div className="ml-auto flex items-center gap-1">
            {notificationsHref ? (
              <>
                <NotificationBell href={notificationsHref} count={notificationCount} />
                <Separator orientation="vertical" className="mx-1 h-6" />
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
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
        <footer className="py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Operix. Desarrollado por Cristhian Prestán.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
