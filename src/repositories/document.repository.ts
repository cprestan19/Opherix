/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import type { DocumentType } from "@/generated/prisma/enums";

export function createDocument(data: {
  workerId: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  issuedAt?: Date;
  expiresAt?: Date;
}) {
  return prisma.workerDocument.create({ data });
}

export function listDocumentsForWorker(workerId: string) {
  return prisma.workerDocument.findMany({ where: { workerId }, orderBy: { uploadedAt: "desc" } });
}

export function listDocumentsForCompany(companyId: string) {
  return prisma.workerDocument.findMany({
    where: { worker: { companyId } },
    include: { worker: { include: { user: { select: { name: true } } } } },
    orderBy: { expiresAt: "asc" },
  });
}

export function findExpiringDocuments(companyId: string, daysAhead: number) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysAhead);

  return prisma.workerDocument.findMany({
    where: {
      worker: { companyId },
      expiresAt: { not: null, lte: threshold, gte: new Date() },
    },
    include: { worker: { include: { user: { select: { id: true, name: true } } } } },
  });
}
