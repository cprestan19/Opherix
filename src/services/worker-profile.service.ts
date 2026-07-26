/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

export async function getWorkerProfileByUserId(userId: string) {
  return prisma.worker.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
    },
  });
}

export async function getWorkerProfileById(companyId: string, workerId: string) {
  return prisma.worker.findFirst({
    where: { id: workerId, companyId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
    },
  });
}
