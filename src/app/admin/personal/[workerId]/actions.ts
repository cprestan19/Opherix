/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyStaff } from "@/lib/tenant";
import { workerEditSchema, type WorkerEditInput } from "@/lib/validations/worker-edit";
import {
  updateWorkerProfile,
  setWorkerAccountStatus,
  setWorkerHourlyRate,
  deleteWorker,
  restoreWorker,
  WorkerError,
} from "@/services/worker.service";
import { findWorkerById } from "@/repositories/worker.repository";
import { uploadDocument, updateDocument, deleteDocument, DocumentError } from "@/services/document.service";
import { toggleSlot, AvailabilityError } from "@/services/availability.service";
import type { DocumentType } from "@/generated/prisma/enums";

export interface ActionResult {
  error?: string;
}

export async function updateWorkerAction(workerId: string, input: WorkerEditInput): Promise<ActionResult> {
  const parsed = workerEditSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los campos del formulario." };

  const { user, companyId } = await requireCompanyStaff();

  try {
    await updateWorkerProfile(companyId, user.id, user.role, workerId, parsed.data);
  } catch (error) {
    if (error instanceof WorkerError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/admin/personal/${workerId}`);
  revalidatePath(`/admin/personal/${workerId}/editar`);
  return {};
}

export async function setWorkerStatusAction(
  workerId: string,
  status: "ACTIVE" | "INACTIVE",
): Promise<ActionResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await setWorkerAccountStatus(companyId, user.id, workerId, status);
  } catch (error) {
    if (error instanceof WorkerError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/admin/personal/${workerId}`);
  return {};
}

export async function deleteWorkerAction(workerId: string, reason: string): Promise<ActionResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await deleteWorker(companyId, user.id, workerId, reason);
  } catch (error) {
    if (error instanceof WorkerError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/admin/personal/${workerId}`);
  revalidatePath("/admin/personal");
  return {};
}

export async function restoreWorkerAction(workerId: string): Promise<ActionResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await restoreWorker(companyId, user.id, workerId);
  } catch (error) {
    if (error instanceof WorkerError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/admin/personal/${workerId}`);
  revalidatePath("/admin/personal");
  return {};
}

export async function setWorkerHourlyRateAction(workerId: string, hourlyRate: number): Promise<ActionResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await setWorkerHourlyRate(companyId, user.id, user.role, workerId, hourlyRate);
  } catch (error) {
    if (error instanceof WorkerError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/admin/personal/${workerId}`);
  return {};
}

export async function uploadWorkerDocumentAction(
  workerId: string,
  input: { type: DocumentType; fileUrl: string; fileName: string; issuedAt?: string; expiresAt?: string },
): Promise<ActionResult> {
  const { user, companyId } = await requireCompanyStaff();

  const worker = await findWorkerById(companyId, workerId);
  if (!worker) return { error: "Trabajador no encontrado." };

  await uploadDocument(companyId, workerId, user.id, input);
  revalidatePath(`/admin/personal/${workerId}`);
  revalidatePath(`/admin/personal/${workerId}/editar`);
  return {};
}

export async function updateWorkerDocumentAction(
  documentId: string,
  input: { type?: DocumentType; fileUrl?: string; fileName?: string; issuedAt?: string; expiresAt?: string },
): Promise<ActionResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await updateDocument(companyId, user.id, documentId, input);
  } catch (error) {
    if (error instanceof DocumentError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/personal", "layout");
  return {};
}

export async function deleteWorkerDocumentAction(documentId: string): Promise<ActionResult> {
  const { user, companyId } = await requireCompanyStaff();

  try {
    await deleteDocument(companyId, user.id, documentId);
  } catch (error) {
    if (error instanceof DocumentError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/personal", "layout");
  return {};
}

export async function toggleWorkerAvailabilityAction(
  workerId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
): Promise<ActionResult> {
  const { companyId } = await requireCompanyStaff();

  const worker = await findWorkerById(companyId, workerId);
  if (!worker) return { error: "Trabajador no encontrado." };

  try {
    await toggleSlot(workerId, dayOfWeek, startTime, endTime);
  } catch (error) {
    if (error instanceof AvailabilityError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/admin/personal/${workerId}`);
  revalidatePath(`/admin/personal/${workerId}/editar`);
  return {};
}
