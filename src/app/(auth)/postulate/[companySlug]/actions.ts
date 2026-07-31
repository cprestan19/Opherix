/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { workerApplicationSchema, type WorkerApplicationInput } from "@/lib/validations/worker-application";
import { submitApplication, ApplicationError } from "@/services/recruitment.service";
import { isRateLimited, getClientIpFromHeaderList } from "@/lib/rate-limit";

export interface SubmitApplicationResult {
  error?: string;
}

// A diferencia de /solicitar/[companySlug] (que tiene Turnstile + rate limit
// persistente en BD, ver public-event-request.service.ts), este formulario no
// tenía ningún control anti-abuso server-side — un script podía crear
// aspirantes falsos sin límite. Best-effort en memoria (§ ver rate-limit.ts)
// mientras se evalúa sumar Turnstile aquí también.
const MAX_APPLICATIONS_PER_WINDOW = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export async function submitApplicationAction(
  companySlug: string,
  input: WorkerApplicationInput,
): Promise<SubmitApplicationResult | void> {
  const parsed = workerApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Revisa los campos marcados en el formulario." };
  }

  const headerList = await headers();
  const ip = getClientIpFromHeaderList(headerList);
  if (isRateLimited(`postulate:${companySlug}:${ip}`, MAX_APPLICATIONS_PER_WINDOW, WINDOW_MS)) {
    return { error: "Ya enviaste demasiadas postulaciones desde esta conexión. Intenta de nuevo más tarde." };
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
