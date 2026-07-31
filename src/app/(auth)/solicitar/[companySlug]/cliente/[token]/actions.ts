/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { randomUUID } from "crypto";
import { findCompanyBySlug, filterActiveWorkerIds } from "@/repositories/worker.repository";
import { findClientByAccessToken } from "@/repositories/client.repository";
import { createEventRequest, generateEventAccessLink, EventError } from "@/services/event.service";
import { eventRequestSchema, type EventRequestInput } from "@/lib/validations/event";
import { MAX_EVENTS_PER_BATCH } from "@/lib/event-batch";

export interface CreateEventsForClientItemResult {
  success: boolean;
  title: string;
  eventId?: string;
  eventAccessToken?: string;
  error?: string;
}

export interface CreateEventsForClientResult {
  error?: string;
  items?: CreateEventsForClientItemResult[];
}

/**
 * Crea uno o varios eventos de una sola vez para un cliente YA conocido vía
 * su URL propia (§ Client.accessToken) — el cliente arma varios borradores
 * en el navegador (§ new-event-form.tsx) y recién aquí se guardan en BD, todos
 * en el mismo envío. Cada evento se crea de forma independiente (no en una
 * única transacción de BD): si uno falla no bloquea a los demás, y el
 * resultado por evento le permite al cliente ver exactamente cuáles sí
 * quedaron creados y cuáles debe reintentar — nunca queda "a medias" sin que
 * se entere. Comparten un batchId en el AuditLog para que el Administrador
 * vea que llegaron juntos.
 */
export async function createEventsForClientAction(
  companySlug: string,
  token: string,
  inputs: EventRequestInput[],
): Promise<CreateEventsForClientResult> {
  if (inputs.length === 0) return { error: "Agrega al menos un evento antes de enviar." };
  if (inputs.length > MAX_EVENTS_PER_BATCH) {
    return { error: `Puedes enviar hasta ${MAX_EVENTS_PER_BATCH} eventos por envío.` };
  }

  const company = await findCompanyBySlug(companySlug);
  if (!company) return { error: "Enlace no válido." };

  const client = await findClientByAccessToken(company.id, token);
  if (!client) return { error: "Enlace no válido." };

  const batchId = inputs.length > 1 ? randomUUID() : undefined;
  const items: CreateEventsForClientItemResult[] = [];

  for (const rawInput of inputs) {
    const parsed = eventRequestSchema.safeParse(rawInput);
    if (!parsed.success) {
      items.push({ success: false, title: rawInput.title || "(sin título)", error: "Revisa los campos del formulario." });
      continue;
    }

    // Nunca confiar en los IDs tal cual llegan del formulario público (sin
    // sesión) — se validan contra el roster real de esta empresa antes de
    // guardarlos como preferencia.
    const preferredWorkerIds = parsed.data.preferredWorkerIds?.length
      ? await filterActiveWorkerIds(company.id, parsed.data.preferredWorkerIds)
      : undefined;

    try {
      const event = await createEventRequest(
        company.id,
        client.id,
        null,
        { ...parsed.data, preferredWorkerIds },
        undefined,
        batchId ? { batchId, batchSize: inputs.length } : undefined,
      );
      const { token: eventAccessToken } = await generateEventAccessLink(company.id, null, event.id);
      items.push({ success: true, title: event.title, eventId: event.id, eventAccessToken });
    } catch (error) {
      const message = error instanceof EventError ? error.message : "No se pudo crear este evento.";
      items.push({ success: false, title: parsed.data.title, error: message });
    }
  }

  return { items };
}
