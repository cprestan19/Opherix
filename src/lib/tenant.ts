/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { auth } from "@/lib/auth";

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
  return session.user;
}
