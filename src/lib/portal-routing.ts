/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import type { WorkerStatus } from "@/generated/prisma/enums";
import type { SessionRole } from "@/types/next-auth";
import { auth } from "@/lib/auth";

/**
 * Ruta base del portal según rol (y, para trabajadores, según su estado en la
 * máquina de estados Aspirante -> Trabajador, ver CLAUDE.md §5).
 */
export function getPortalPath(role: SessionRole, workerStatus?: WorkerStatus | null): string {
  switch (role) {
    case "PLATFORM_ADMIN":
      return "/platform";
    case "ADMIN":
    case "SUPERVISOR":
      return "/admin";
    case "CLIENT":
      // El portal /cliente/* con cuenta y contraseña fue reemplazado por el
      // formulario público /solicitar/[companySlug], sin cuenta ni login —
      // un User con role CLIENT ya no tiene ningún portal propio al que entrar.
      return "/login";
    case "WORKER":
    case "APPLICANT":
      if (workerStatus === "PENDING_REVIEW" || workerStatus === "REJECTED") {
        return "/trabajador/postulacion";
      }
      return "/trabajador";
    default:
      return "/login";
  }
}

export async function getPortalPathForUser(): Promise<string> {
  const session = await auth();
  if (!session?.user) return "/login";
  return getPortalPath(session.user.role, session.user.workerStatus);
}
