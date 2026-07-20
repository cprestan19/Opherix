/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { redirect } from "next/navigation";
import { LayoutDashboard, Users, CalendarDays, Receipt } from "lucide-react";
import { auth } from "@/lib/auth";
import { getPortalPath } from "@/lib/portal-routing";
import { PortalShell } from "@/components/shared/portal-shell";
import type { NavGroup } from "@/components/shared/app-sidebar";

const navGroups: NavGroup[] = [
  { label: "Principal", items: [{ title: "Dashboard", href: "/cliente", icon: <LayoutDashboard /> }] },
  {
    label: "Contratación",
    items: [
      { title: "Buscar personal", href: "/cliente/personal", icon: <Users /> },
      { title: "Mis eventos", href: "/cliente/eventos", icon: <CalendarDays /> },
    ],
  },
  { label: "Cuenta", items: [{ title: "Historial y facturas", href: "/cliente/facturas", icon: <Receipt /> }] },
];

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "CLIENT") {
    redirect(getPortalPath(session.user.role, session.user.workerStatus));
  }

  return (
    <PortalShell
      portalName="Cliente"
      navGroups={navGroups}
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
