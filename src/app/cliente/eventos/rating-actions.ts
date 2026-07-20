/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { revalidatePath } from "next/cache";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { submitRating, RatingError } from "@/services/rating.service";

export interface RatingActionResult {
  error?: string;
}

export async function submitRatingAction(
  assignmentId: string,
  score: number,
  comment: string,
): Promise<RatingActionResult> {
  const companyId = await getEffectiveCompanyId();
  const user = await getCurrentUser();
  if (!user.clientId) return { error: "Tu usuario no está vinculado a una cuenta cliente." };

  try {
    await submitRating(companyId, user.clientId, user.id, assignmentId, score, comment || undefined);
  } catch (error) {
    if (error instanceof RatingError) return { error: error.message };
    throw error;
  }

  revalidatePath("/cliente/eventos");
  return {};
}
