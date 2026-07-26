/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { revalidatePath } from "next/cache";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { createWorkerSchema, type CreateWorkerInput } from "@/lib/validations/worker-create";
import { createWorker, WorkerError } from "@/services/worker.service";

export interface CreateWorkerResult {
  error?: string;
}

export async function createWorkerAction(input: CreateWorkerInput): Promise<CreateWorkerResult> {
  const parsed = createWorkerSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los campos del formulario." };

  const companyId = await getEffectiveCompanyId();
  const user = await getCurrentUser();

  try {
    await createWorker(companyId, user.id, parsed.data);
  } catch (error) {
    if (error instanceof WorkerError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/personal");
  return {};
}
