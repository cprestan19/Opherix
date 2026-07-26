/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { auth } from "@/lib/auth";
import type { SessionRole } from "@/types/next-auth";

/**
 * Resuelve el companyId del tenant actual a partir de la sesión autenticada.
 * Nunca confiar en un companyId enviado por el cliente (body/query/header) —
 * siempre derivarlo del JWT server-side. Ver CLAUDE.md §9.10.
 */
export async function getEffectiveCompanyId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.companyId) {
    throw new Error("UNAUTHENTICATED: no active session with companyId");
  }
  return session.user.companyId;
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }
  // `accountActive` viene de la revalidación periódica del jwt callback
  // (ver auth.ts) — si el admin suspendió/borró la cuenta después de que se
  // emitió este JWT, cortarla aquí en vez de esperar hasta que expire (30 días).
  if (session.user.accountActive === false) {
    throw new Error("UNAUTHENTICATED: cuenta suspendida o eliminada");
  }
  return session.user;
}

/**
 * Lanzado cuando un usuario autenticado (con sesión válida) intenta ejecutar
 * una acción para la que su rol no está autorizado. Distinto de
 * "UNAUTHENTICATED": aquí sí hay sesión, solo falta permiso.
 */
export class ForbiddenError extends Error {
  constructor(message = "No tienes permiso para realizar esta acción.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Server Actions son endpoints POST independientes — NO heredan el guard de
 * rol de `layout.tsx` (eso solo protege la navegación/renderizado de página).
 * Toda acción sensible debe llamar esto (o `requireCompanyStaff`/`requireAdmin`)
 * al inicio, no confiar en que el enlace/botón esté oculto en la UI.
 */
export async function requireRole(...allowed: SessionRole[]) {
  const user = await getCurrentUser();
  if (!allowed.includes(user.role)) {
    throw new ForbiddenError();
  }
  return user;
}

/** Acciones del portal Administrador: permitido para ADMIN y SUPERVISOR (mismo gate que admin/layout.tsx). */
export async function requireCompanyStaff() {
  const user = await requireRole("ADMIN", "SUPERVISOR");
  if (!user.companyId) {
    throw new Error("UNAUTHENTICATED: no active session with companyId");
  }
  return { user, companyId: user.companyId };
}

/** Acciones restringidas exclusivamente a ADMIN (ej. tarifas, reglas de pago, configuración de empresa). */
export async function requireAdmin() {
  const user = await requireRole("ADMIN");
  if (!user.companyId) {
    throw new Error("UNAUTHENTICATED: no active session with companyId");
  }
  return { user, companyId: user.companyId };
}
