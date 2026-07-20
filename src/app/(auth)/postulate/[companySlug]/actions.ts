/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { redirect } from "next/navigation";
import { workerApplicationSchema, type WorkerApplicationInput } from "@/lib/validations/worker-application";
import { submitApplication, ApplicationError } from "@/services/recruitment.service";

export interface SubmitApplicationResult {
  error?: string;
}

export async function submitApplicationAction(
  companySlug: string,
  input: WorkerApplicationInput,
): Promise<SubmitApplicationResult | void> {
  const parsed = workerApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Revisa los campos marcados en el formulario." };
  }

  try {
    await submitApplication(companySlug, parsed.data);
  } catch (error) {
    if (error instanceof ApplicationError) {
      return { error: error.message };
    }
    throw error;
  }

  redirect(`/postulate/${companySlug}/gracias`);
}
