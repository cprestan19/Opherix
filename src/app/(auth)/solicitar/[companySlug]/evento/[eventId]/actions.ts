/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { findCompanyBySlug } from "@/repositories/worker.repository";
import { eventRequestSchema, type EventRequestInput } from "@/lib/validations/event";
import { submitEventRatingSchema } from "@/lib/validations/rating";
import { updateEventRequestViaAccessToken, EventError } from "@/services/event.service";
import { submitEventRatingViaAccessToken, RatingError } from "@/services/rating.service";

export interface EventAccessActionResult {
  error?: string;
}

async function resolveCompanyId(companySlug: string) {
  const company = await findCompanyBySlug(companySlug);
  if (!company) notFound();
  return company.id;
}

export async function updateEventViaTokenAction(
  companySlug: string,
  eventId: string,
  token: string,
  input: EventRequestInput,
): Promise<EventAccessActionResult> {
  const parsed = eventRequestSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los campos del formulario." };

  const companyId = await resolveCompanyId(companySlug);

  try {
    await updateEventRequestViaAccessToken(companyId, eventId, token, parsed.data);
  } catch (error) {
    if (error instanceof EventError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/solicitar/${companySlug}/evento/${eventId}`);
  return {};
}

export async function submitEventRatingAction(
  companySlug: string,
  eventId: string,
  token: string,
  score: number,
  comment: string,
): Promise<EventAccessActionResult> {
  const parsed = submitEventRatingSchema.safeParse({ score, comment: comment || undefined });
  if (!parsed.success) return { error: "Revisa la calificación ingresada." };

  const companyId = await resolveCompanyId(companySlug);

  try {
    await submitEventRatingViaAccessToken(companyId, eventId, token, parsed.data.score, parsed.data.comment);
  } catch (error) {
    if (error instanceof RatingError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/solicitar/${companySlug}/evento/${eventId}`);
  return {};
}
