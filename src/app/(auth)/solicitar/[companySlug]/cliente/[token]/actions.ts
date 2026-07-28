/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { findCompanyBySlug } from "@/repositories/worker.repository";
import { findClientByAccessToken } from "@/repositories/client.repository";
import { createEventRequest, generateEventAccessLink, EventError } from "@/services/event.service";
import { eventRequestSchema, type EventRequestInput } from "@/lib/validations/event";

export interface CreateEventForClientResult {
  error?: string;
  eventId?: string;
  eventAccessToken?: string;
}

/**
 * Crea un evento nuevo para un cliente YA conocido vía su URL propia (§
 * Client.accessToken) — reusa createEventRequest tal cual (misma que usa el
 * formulario público general), solo que aquí el clientId ya está resuelto
 * por el token en vez de crearse/buscarse por correo.
 */
export async function createEventForClientAction(
  companySlug: string,
  token: string,
  input: EventRequestInput,
): Promise<CreateEventForClientResult> {
  const parsed = eventRequestSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los campos del formulario." };

  const company = await findCompanyBySlug(companySlug);
  if (!company) return { error: "Enlace no válido." };

  const client = await findClientByAccessToken(company.id, token);
  if (!client) return { error: "Enlace no válido." };

  try {
    const event = await createEventRequest(company.id, client.id, null, parsed.data);
    const { token: eventAccessToken } = await generateEventAccessLink(company.id, null, event.id);
    return { eventId: event.id, eventAccessToken };
  } catch (error) {
    if (error instanceof EventError) return { error: error.message };
    throw error;
  }
}
