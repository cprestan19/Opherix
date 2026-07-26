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
