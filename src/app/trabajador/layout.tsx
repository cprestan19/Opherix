/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck2,
  Clock,
  MapPinCheck,
  Wallet,
  FileText,
  UserRound,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getPortalPath } from "@/lib/portal-routing";
import { PortalShell } from "@/components/shared/portal-shell";
import { PushPermission } from "@/components/shared/push-permission";
import type { NavGroup } from "@/components/shared/app-sidebar";

const navGroups: NavGroup[] = [
  { label: "Principal", items: [{ title: "Dashboard", href: "/trabajador", icon: <LayoutDashboard /> }] },
  {
    label: "Trabajo",
    items: [
      { title: "Mis asignaciones", href: "/trabajador/asignaciones", icon: <CalendarCheck2 /> },
      { title: "Disponibilidad", href: "/trabajador/disponibilidad", icon: <Clock /> },
      { title: "Check-in", href: "/trabajador/check-in", icon: <MapPinCheck /> },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { title: "Pagos", href: "/trabajador/pagos", icon: <Wallet /> },
      { title: "Documentos", href: "/trabajador/documentos", icon: <FileText /> },
      { title: "Mi perfil", href: "/trabajador/perfil", icon: <UserRound /> },
    ],
  },
];

export default async function TrabajadorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.accountActive === false) redirect("/login");
  if (session.user.role !== "WORKER" && session.user.role !== "APPLICANT") {
    redirect(getPortalPath(session.user.role, session.user.workerStatus));
  }

  return (
    <PortalShell
      portalName="Trabajador"
      navGroups={navGroups}
      primaryNavHrefs={[
        "/trabajador",
        "/trabajador/asignaciones",
        "/trabajador/check-in",
        "/trabajador/disponibilidad",
      ]}
      profileHref="/trabajador/perfil"
      user={{
        name: session.user.name ?? session.user.email ?? "Usuario",
        email: session.user.email ?? "",
        image: session.user.image ?? undefined,
      }}
    >
      <PushPermission />
      {children}
    </PortalShell>
  );
}
