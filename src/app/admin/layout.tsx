/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Building2,
  CalendarDays,
  Clock,
  MapPinCheck,
  Wallet,
  FileText,
  BarChart3,
  Bell,
  Settings,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getPortalPath } from "@/lib/portal-routing";
import { PortalShell } from "@/components/shared/portal-shell";
import type { NavGroup } from "@/components/shared/app-sidebar";
import { countUnreadForUser } from "@/repositories/notification.repository";

const navGroups: NavGroup[] = [
  { label: "Principal", items: [{ title: "Dashboard", href: "/admin", icon: <LayoutDashboard /> }] },
  {
    label: "Gestión",
    items: [
      { title: "Reclutamiento", href: "/admin/reclutamiento", icon: <UserPlus /> },
      { title: "Personal", href: "/admin/personal", icon: <Users /> },
      { title: "Clientes", href: "/admin/clientes", icon: <Building2 /> },
      { title: "Eventos", href: "/admin/eventos", icon: <CalendarDays /> },
      { title: "Disponibilidad", href: "/admin/disponibilidad", icon: <Clock /> },
    ],
  },
  {
    label: "Operación",
    items: [
      { title: "Check-in", href: "/admin/check-in", icon: <MapPinCheck /> },
      { title: "Pagos", href: "/admin/pagos", icon: <Wallet /> },
      { title: "Documentos", href: "/admin/documentos", icon: <FileText /> },
    ],
  },
  {
    label: "Análisis",
    items: [
      { title: "Reportes", href: "/admin/reportes", icon: <BarChart3 /> },
      { title: "Notificaciones", href: "/admin/notificaciones", icon: <Bell /> },
    ],
  },
  { label: "Sistema", items: [{ title: "Configuración", href: "/admin/configuracion", icon: <Settings /> }] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR") {
    redirect(getPortalPath(session.user.role, session.user.workerStatus));
  }

  const notificationCount = await countUnreadForUser(session.user.id);

  return (
    <PortalShell
      portalName="Administrador"
      navGroups={navGroups}
      notificationsHref="/admin/notificaciones"
      notificationCount={notificationCount}
      user={{
        name: session.user.name ?? session.user.email ?? "Usuario",
        email: session.user.email ?? "",
        image: session.user.image ?? undefined,
      }}
    >
      {children}
    </PortalShell>
  );
}
