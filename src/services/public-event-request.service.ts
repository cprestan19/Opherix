/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as eventRepo from "@/repositories/event.repository";
import * as clientRepo from "@/repositories/client.repository";
import * as accessTokenRepo from "@/repositories/client-access-token.repository";
import { generateClientAccessToken } from "@/lib/client-access-token";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createEventRequest, generateEventAccessLink } from "@/services/event.service";
import type { PublicEventRequestInput } from "@/lib/validations/public-event-request";

export class PublicEventRequestError extends Error {}

const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_REQUESTS_PER_EMAIL = 5;
// Más laxo que por correo — varias personas de una misma oficina/evento
// pueden compartir la misma IP pública.
const MAX_REQUESTS_PER_IP = 15;

/**
 * Si el correo ya solicitó antes, precarga nombre/teléfono desde su Client
 * existente — cortesía de autocompletar, no un "inicio de sesión" (§ ticket
 * punto 4: reconocimiento de cliente recurrente sin registro explícito).
 */
export async function findReturningContact(companyId: string, email: string) {
  const client = await clientRepo.findClientByEmail(companyId, email);
  if (!client) return null;
  return { contactName: client.contactName, contactPhone: client.contactPhone ?? "" };
}

/**
 * Formulario público sin verificación de correo (por decisión explícita: sin
 * intervención de correos en este flujo) — protegido solo por Turnstile +
 * rate limiting por correo/IP. Crea (o reutiliza) el Client y el Event de
 * inmediato, y entrega la cookie "recuérdame sin contraseña" en el mismo paso.
 */
export async function submitPublicEventRequest(
  companyId: string,
  input: PublicEventRequestInput,
  ip: string | undefined,
): Promise<{ eventId: string; clientAccessToken: string; eventAccessToken: string }> {
  const turnstileOk = await verifyTurnstileToken(input.turnstileToken, ip);
  if (!turnstileOk) {
    throw new PublicEventRequestError("No se pudo verificar que eres humano. Intenta de nuevo.");
  }

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const emailCount = await eventRepo.countRecentPublicRequestsByEmail(companyId, input.contactEmail, since);
  if (emailCount >= MAX_REQUESTS_PER_EMAIL) {
    throw new PublicEventRequestError(
      "Ya enviaste demasiadas solicitudes con este correo. Intenta de nuevo en 24 horas.",
    );
  }
  if (ip) {
    const ipCount = await eventRepo.countRecentPublicRequestsByIp(companyId, ip, since);
    if (ipCount >= MAX_REQUESTS_PER_IP) {
      throw new PublicEventRequestError("Demasiadas solicitudes desde esta conexión. Intenta de nuevo en 24 horas.");
    }
  }

  const contactEmail = input.contactEmail.toLowerCase();
  let client = await clientRepo.findClientByEmailOrPhone(companyId, contactEmail, input.contactPhone);
  if (!client) {
    client = await clientRepo.createClient({
      companyId,
      businessName: input.contactName,
      contactName: input.contactName,
      contactEmail,
      contactPhone: input.contactPhone,
    });
  }

  const event = await createEventRequest(
    companyId,
    client.id,
    null,
    {
      title: input.eventTitle,
      eventType: input.eventType,
      address: input.address,
      startAt: input.startAt,
      endAt: input.endAt,
      notes: input.notes,
      staffRequirements: input.staffNeeded,
    },
    ip,
  );

  const { token, tokenHash, expiresAt } = generateClientAccessToken();
  await accessTokenRepo.createClientAccessToken({
    companyId,
    clientId: client.id,
    email: contactEmail,
    tokenHash,
    expiresAt,
  });

  // El mismo link que el cliente usará para ver/editar la solicitud y, al
  // finalizar el evento, calificar el servicio (§ "el link inicial").
  const { token: eventAccessToken } = await generateEventAccessLink(companyId, null, event.id);

  return { eventId: event.id, clientAccessToken: token, eventAccessToken };
}
