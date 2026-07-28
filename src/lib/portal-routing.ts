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
 *
 * `mustChangePassword` tiene prioridad sobre cualquier otra cosa: cuando un
 * Administrador otorga/reenvía acceso al portal (§ admin/personal), la
 * contraseña generada viaja por WhatsApp — no es realmente privada hasta que
 * el dueño la cambia, así que se pinea a /cambiar-clave antes que nada más.
 */
export function getPortalPath(
  role: SessionRole,
  workerStatus?: WorkerStatus | null,
  mustChangePassword?: boolean,
): string {
  if (mustChangePassword) return "/cambiar-clave";

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
  return getPortalPath(session.user.role, session.user.workerStatus, session.user.mustChangePassword);
}
