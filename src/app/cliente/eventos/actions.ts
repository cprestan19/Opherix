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
import { eventRequestSchema, type EventRequestInput } from "@/lib/validations/event";
import { createEventRequest, EventError } from "@/services/event.service";

export interface CreateEventResult {
  error?: string;
}

export async function createEventAction(input: EventRequestInput): Promise<CreateEventResult> {
  const parsed = eventRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Revisa los campos del formulario." };
  }

  const companyId = await getEffectiveCompanyId();
  const user = await getCurrentUser();
  if (!user.clientId) {
    return { error: "Tu usuario no está vinculado a una cuenta cliente." };
  }

  try {
    await createEventRequest(companyId, user.clientId, user.id, parsed.data);
  } catch (error) {
    if (error instanceof EventError) return { error: error.message };
    throw error;
  }

  revalidatePath("/cliente/eventos");
  return {};
}
