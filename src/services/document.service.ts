/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as documentRepo from "@/repositories/document.repository";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { dispatchNotification } from "@/services/notification.service";
import { deleteImageKitFileByUrl } from "@/lib/imagekit-delete";
import type { DocumentType } from "@/generated/prisma/enums";

export class DocumentError extends Error {}

export async function uploadDocument(
  companyId: string,
  workerId: string,
  actorId: string,
  data: { type: DocumentType; fileUrl: string; fileName: string; issuedAt?: string; expiresAt?: string },
) {
  const document = await documentRepo.createDocument({
    workerId,
    type: data.type,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    issuedAt: data.issuedAt ? new Date(data.issuedAt) : undefined,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
  });

  await logAudit({
    companyId,
    actorId,
    action: "DOCUMENT_UPLOADED",
    entityType: "WorkerDocument",
    entityId: document.id,
    metadata: { type: data.type },
  });

  return document;
}

async function assertDocumentInCompany(companyId: string, documentId: string) {
  const document = await documentRepo.findDocumentById(documentId);
  if (!document || document.worker.companyId !== companyId) {
    throw new DocumentError("Documento no encontrado.");
  }
  return document;
}

export async function updateDocument(
  companyId: string,
  actorId: string,
  documentId: string,
  data: { type?: DocumentType; fileUrl?: string; fileName?: string; issuedAt?: string; expiresAt?: string },
) {
  await assertDocumentInCompany(companyId, documentId);

  const document = await documentRepo.updateDocument(documentId, {
    type: data.type,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    issuedAt: data.issuedAt ? new Date(data.issuedAt) : data.issuedAt === "" ? null : undefined,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : data.expiresAt === "" ? null : undefined,
  });

  await logAudit({
    companyId,
    actorId,
    action: "DOCUMENT_UPDATED",
    entityType: "WorkerDocument",
    entityId: documentId,
  });

  return document;
}

export async function deleteDocument(companyId: string, actorId: string, documentId: string) {
  const document = await assertDocumentInCompany(companyId, documentId);

  await documentRepo.deleteDocument(documentId);
  await deleteImageKitFileByUrl(document.fileUrl);

  await logAudit({
    companyId,
    actorId,
    action: "DOCUMENT_DELETED",
    entityType: "WorkerDocument",
    entityId: documentId,
    metadata: { fileName: document.fileName },
  });
}

const ALERT_WINDOWS_DAYS = [30, 14, 7];

/**
 * Verificación diaria de documentos por vencer (§9.4 — Vercel Cron). Despacha
 * la notificación (email + push si hay token).
 */
export async function checkExpiringDocumentsForCompany(companyId: string) {
  let notified = 0;

  for (const daysAhead of ALERT_WINDOWS_DAYS) {
    const documents = await documentRepo.findExpiringDocuments(companyId, daysAhead);
    for (const doc of documents) {
      const alreadyNotifiedToday = await prisma.notification.findFirst({
        where: {
          userId: doc.worker.user.id,
          type: "DOCUMENT_EXPIRING",
          relatedEntityId: doc.id,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      });
      if (alreadyNotifiedToday) continue;

      await dispatchNotification({
        companyId,
        userId: doc.worker.user.id,
        type: "DOCUMENT_EXPIRING",
        title: "Documento por vencer",
        body: `Tu documento "${doc.fileName}" vence pronto. Actualízalo para seguir activo.`,
        relatedEntityType: "WorkerDocument",
        relatedEntityId: doc.id,
      });
      notified += 1;
    }
  }

  return { notified };
}
