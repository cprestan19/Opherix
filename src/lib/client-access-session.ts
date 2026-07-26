/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { cookies } from "next/headers";
import { CLIENT_ACCESS_COOKIE_NAME, hashClientAccessToken } from "@/lib/client-access-token";
import { findValidClientAccessToken } from "@/repositories/client-access-token.repository";

/**
 * Sesión "recuérdame sin contraseña" para /solicitar/[companySlug]/estado —
 * lee la cookie httpOnly, la valida contra ClientAccessToken (hash + no
 * expirada). Nunca otorga acceso a rutas de Administrador/Supervisor/
 * Trabajador — es un mecanismo aparte, no una sesión de NextAuth.
 */
export async function getClientAccessSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CLIENT_ACCESS_COOKIE_NAME)?.value;
  if (!token) return null;

  const record = await findValidClientAccessToken(hashClientAccessToken(token));
  if (!record) return null;

  return { clientId: record.clientId, companyId: record.companyId, email: record.email, client: record.client };
}
