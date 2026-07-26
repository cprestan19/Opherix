/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { eventRequestSchema, type EventRequestInput } from "@/lib/validations/event";
import { updateEventRequestAsClient, EventError } from "@/services/event.service";
import { getClientAccessSession } from "@/lib/client-access-session";
import { CLIENT_ACCESS_COOKIE_NAME, hashClientAccessToken } from "@/lib/client-access-token";
import { revokeClientAccessToken } from "@/repositories/client-access-token.repository";

export interface ClientRequestActionResult {
  error?: string;
}

export async function updateEventRequestClientAction(
  companySlug: string,
  eventId: string,
  input: EventRequestInput,
): Promise<ClientRequestActionResult> {
  const parsed = eventRequestSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los campos del formulario." };

  const session = await getClientAccessSession();
  if (!session) return { error: "Tu sesión expiró. Vuelve a verificar tu correo." };

  try {
    await updateEventRequestAsClient(session.companyId, session.clientId, eventId, parsed.data);
  } catch (error) {
    if (error instanceof EventError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/solicitar/${companySlug}/estado`);
  return {};
}

export async function signOutClientSessionAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CLIENT_ACCESS_COOKIE_NAME)?.value;
  if (token) {
    await revokeClientAccessToken(hashClientAccessToken(token));
  }
  cookieStore.delete(CLIENT_ACCESS_COOKIE_NAME);
}
