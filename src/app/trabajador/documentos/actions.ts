/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { revalidatePath } from "next/cache";
import { requireActiveWorker } from "@/lib/worker-guard";
import { getWorkerIdForUser } from "@/repositories/availability.repository";
import { uploadDocument } from "@/services/document.service";
import type { DocumentType } from "@/generated/prisma/enums";

export async function uploadDocumentAction(input: {
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  issuedAt?: string;
  expiresAt?: string;
}) {
  const user = await requireActiveWorker();
  const worker = await getWorkerIdForUser(user.id);
  if (!worker) throw new Error("Perfil de trabajador no encontrado.");

  await uploadDocument(worker.companyId, worker.id, user.id, input);
  revalidatePath("/trabajador/documentos");
}
