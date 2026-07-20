/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { redirect } from "next/navigation";
import { LayoutDashboard, Building2, Activity, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { getPortalPath } from "@/lib/portal-routing";
import { PortalShell } from "@/components/shared/portal-shell";
import type { NavGroup } from "@/components/shared/app-sidebar";

const navGroups: NavGroup[] = [
  { label: "Principal", items: [{ title: "Dashboard", href: "/platform", icon: <LayoutDashboard /> }] },
  {
    label: "Plataforma",
    items: [
      { title: "Empresas", href: "/platform/empresas", icon: <Building2 /> },
      { title: "Actividad", href: "/platform/actividad", icon: <Activity /> },
      { title: "Equipo", href: "/platform/equipo", icon: <Users /> },
    ],
  },
];

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "PLATFORM_ADMIN") {
    redirect(getPortalPath(session.user.role, session.user.workerStatus));
  }

  return (
    <PortalShell
      portalName="Plataforma"
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
