/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

export function createClientAccessToken(data: {
  companyId: string;
  clientId: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  return prisma.clientAccessToken.create({ data });
}

export function findValidClientAccessToken(tokenHash: string) {
  return prisma.clientAccessToken.findFirst({
    where: { tokenHash, expiresAt: { gt: new Date() } },
    include: { client: true },
  });
}

/**
 * Revoca el token en BD al cerrar sesión — no basta con borrar la cookie: si
 * el token ya se filtró (equipo compartido, devtools, logs de proxy), seguiría
 * siendo válido por hasta 7 días más si solo se borra la cookie del cliente.
 */
export async function revokeClientAccessToken(tokenHash: string) {
  await prisma.clientAccessToken.deleteMany({ where: { tokenHash } });
}
