/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use server";

import { headers, cookies } from "next/headers";
import { notFound } from "next/navigation";
import { findCompanyBySlug } from "@/repositories/worker.repository";
import { publicEventRequestSchema, type PublicEventRequestInput } from "@/lib/validations/public-event-request";
import { submitPublicEventRequest, findReturningContact, PublicEventRequestError } from "@/services/public-event-request.service";
import { CLIENT_ACCESS_COOKIE_NAME, CLIENT_ACCESS_TOKEN_TTL_MS } from "@/lib/client-access-token";

export interface PublicEventRequestActionResult {
  error?: string;
  eventId?: string;
  eventAccessToken?: string;
}

async function resolveCompanyId(companySlug: string) {
  const company = await findCompanyBySlug(companySlug);
  if (!company) notFound();
  return company.id;
}

async function getClientIp() {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerList.get("x-real-ip") ?? undefined;
}

export async function submitPublicEventRequestAction(
  companySlug: string,
  input: PublicEventRequestInput,
): Promise<PublicEventRequestActionResult> {
  const parsed = publicEventRequestSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa los campos del formulario." };

  const companyId = await resolveCompanyId(companySlug);
  const ip = await getClientIp();

  try {
    const result = await submitPublicEventRequest(companyId, parsed.data, ip);
    const cookieStore = await cookies();
    cookieStore.set(CLIENT_ACCESS_COOKIE_NAME, result.clientAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: CLIENT_ACCESS_TOKEN_TTL_MS / 1000,
      path: "/solicitar",
    });
    return { eventId: result.eventId, eventAccessToken: result.eventAccessToken };
  } catch (error) {
    if (error instanceof PublicEventRequestError) return { error: error.message };
    // Nunca dejar que un error inesperado se pierda en silencio en un
    // formulario público — el usuario debe ver siempre algún mensaje en
    // vez de que "no pase nada" al presionar enviar.
    console.error("[solicitar] Error inesperado al enviar la solicitud:", error);
    return { error: "No se pudo enviar la solicitud. Intenta de nuevo en unos minutos." };
  }
}

export async function getReturningContactAction(companySlug: string, email: string) {
  if (!email || !email.includes("@")) return null;
  const companyId = await resolveCompanyId(companySlug);
  return findReturningContact(companyId, email);
}
