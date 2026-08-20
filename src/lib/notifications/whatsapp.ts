/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";

const GRAPH_API_VERSION = "v21.0";
// Las 4 plantillas de notificación de Opherix se aprobaron en Meta Business
// Manager con el código de idioma exacto "es_PA" (Español - Panamá), no el
// genérico "es" — Meta rechaza el envío si no coincide carácter por carácter
// (§ error 132001 "Template name does not exist in the translation"). Si en
// el futuro se aprueban variantes por país, esto pasa a ser un parámetro.
const TEMPLATE_LANGUAGE_CODE = "es_PA";

export interface WhatsAppSendResult {
  ok: boolean;
  error?: string;
}

export interface WhatsAppDocumentHeader {
  link: string;
  filename: string;
}

export interface WhatsAppTemplateOptions {
  // Adjunto de header tipo documento (§ orden_trabajo_lista) — Meta descarga
  // el PDF desde `link` al momento de enviar, no requiere subirlo antes al
  // endpoint /media.
  document?: WhatsAppDocumentHeader;
  // Valor del parámetro dinámico del botón URL en el índice 0, cuando la
  // plantilla aprobada tiene un botón de tipo URL con sufijo variable
  // (§ nueva_solicitud_cliente → eventId).
  buttonUrlParam?: string;
}

/**
 * Envía un mensaje de plantilla vía WhatsApp Cloud API (Meta). Nunca lanza
 * — igual contrato que sendEmail/sendPushNotification: un canal de
 * notificación es un refuerzo, no puede romper la acción de negocio que lo
 * dispara. Hace no-op silencioso si faltan credenciales o el destinatario
 * no tiene teléfono normalizable.
 */
export async function sendWhatsAppTemplate(
  to: string | null | undefined,
  templateName: string,
  bodyParams: string[],
  options?: WhatsAppTemplateOptions,
): Promise<WhatsAppSendResult> {
  if (!to) return { ok: false, error: "El destinatario no tiene un teléfono válido para WhatsApp." };

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.info(`[whatsapp:no-op] WhatsApp Cloud API no configurado — se omite envío de "${templateName}" a ${to}`);
    return { ok: false, error: "WhatsApp no está configurado (faltan variables de entorno del servidor)." };
  }

  try {
    const components: Record<string, unknown>[] = [];

    if (options?.document) {
      components.push({
        type: "header",
        parameters: [
          { type: "document", document: { link: options.document.link, filename: options.document.filename } },
        ],
      });
    }

    components.push({
      type: "body",
      parameters: bodyParams.map((text) => ({ type: "text", text })),
    });

    if (options?.buttonUrlParam) {
      components.push({
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{ type: "text", text: options.buttonUrlParam }],
      });
    }

    const response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: TEMPLATE_LANGUAGE_CODE },
          components,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message = errorBody?.error?.message ?? `Error HTTP ${response.status} de WhatsApp Cloud API.`;
      console.error("[whatsapp] Error enviando plantilla:", message);
      return { ok: false, error: message };
    }

    return { ok: true };
  } catch (error) {
    console.error("[whatsapp] Error enviando plantilla:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al enviar el WhatsApp.";
    return { ok: false, error: message };
  }
}
