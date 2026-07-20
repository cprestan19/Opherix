/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

export function listRecentNotifications(companyId: string, take = 50) {
  return prisma.notification.findMany({
    where: { companyId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function countUnreadForUser(userId: string) {
  return prisma.notification.count({ where: { userId, status: "SENT" } });
}
