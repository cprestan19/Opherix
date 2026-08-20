/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail, type EmailAttachment } from "@/lib/notifications/email";
import { sendPushNotification } from "@/lib/notifications/push";
import { sendWhatsAppTemplate, type WhatsAppTemplateOptions } from "@/lib/notifications/whatsapp";
import { normalizePhoneForWhatsApp } from "@/lib/notifications/phone";

export interface WhatsAppTemplateInput extends WhatsAppTemplateOptions {
  templateName: string;
  params: string[];
}

interface NotificationRecordInput {
  companyId: string;
  type: string;
  title: string;
  body: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface DispatchNotificationInput extends NotificationRecordInput {
  userId: string;
  // Plantilla de WhatsApp opcional — cuando se pasa, se manda además de
  // email/push (o en vez de, si el usuario no tiene teléfono normalizable,
  // en cuyo caso ese canal simplemente se omite, igual que push sin fcmToken).
  whatsapp?: WhatsAppTemplateInput;
}

export interface NotifyClientInput extends NotificationRecordInput {
  clientId: string;
  whatsapp?: WhatsAppTemplateInput;
  // Adjunto opcional para el correo (ej. el PDF de la orden de trabajo) —
  // independiente del header de documento de WhatsApp, que se manda por link.
  emailAttachments?: EmailAttachment[];
  // Manda el WhatsApp a este número en vez de Client.contactPhone (§ botón
  // "Reenviar" en /admin/eventos/[eventId] — el Administrador puede mandar la
  // orden de trabajo a alguien más que no sea el contacto registrado).
  whatsappPhoneOverride?: string;
}

// Exactamente uno de userId/clientId — mismo patrón dual-FK opcional que
// PasswordResetToken (§ prisma/schema.prisma, model Notification).
type NotificationRecipient = { userId: string; clientId?: undefined } | { clientId: string; userId?: undefined };

async function recordAndSend(
  input: NotificationRecordInput,
  recipient: NotificationRecipient,
  channel: "EMAIL" | "PUSH" | "WHATSAPP",
  send: () => Promise<{ ok: boolean; error?: string }>,
) {
  const notification = await prisma.notification.create({
    data: {
      companyId: input.companyId,
      userId: recipient.userId,
      clientId: recipient.clientId,
      channel,
      type: input.type,
      title: input.title,
      body: input.body,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
    },
  });

  const result = await send();

  await prisma.notification.update({
    where: { id: notification.id },
    data: {
      status: result.ok ? "SENT" : "FAILED",
      sentAt: result.ok ? new Date() : null,
      errorMessage: result.ok ? null : (result.error ?? "Error desconocido"),
    },
  });

  return result.ok;
}

async function sendWhatsAppIfPossible(
  input: NotificationRecordInput,
  recipient: NotificationRecipient,
  whatsapp: WhatsAppTemplateInput,
  phone: string | null | undefined,
  companyId: string,
) {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { country: true } });
  const normalizedPhone = normalizePhoneForWhatsApp(phone, company?.country ?? "");
  if (!normalizedPhone) return;

  await recordAndSend(input, recipient, "WHATSAPP", () =>
    sendWhatsAppTemplate(normalizedPhone, whatsapp.templateName, whatsapp.params, {
      document: whatsapp.document,
      buttonUrlParam: whatsapp.buttonUrlParam,
    }),
  );
}

/** Notifica a un User (Trabajador/Admin/Supervisor) — email + push + WhatsApp opcional. */
export async function dispatchNotification(input: DispatchNotificationInput) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, fcmToken: true, phone: true },
  });
  if (!user) return;

  const recipient: NotificationRecipient = { userId: input.userId };

  await recordAndSend(input, recipient, "EMAIL", async () => ({
    ok: await sendEmail(user.email, input.title, input.body, input.companyId),
  }));

  if (user.fcmToken) {
    await recordAndSend(input, recipient, "PUSH", () =>
      sendPushNotification(user.fcmToken, input.title, input.body),
    );
  }

  if (input.whatsapp) {
    await sendWhatsAppIfPossible(input, recipient, input.whatsapp, user.phone, input.companyId);
  }
}

/**
 * Notifica a un Client (empresa/persona que solicita personal) — nunca tiene
 * User asociado desde el flujo público /solicitar/[companySlug] (§ CLAUDE.md
 * §4/§5), así que no puede pasar por dispatchNotification. Solo email +
 * WhatsApp opcional (sin push: un Client no tiene sesión ni dispositivo
 * registrado).
 */
export async function notifyClient(input: NotifyClientInput) {
  const client = await prisma.client.findUnique({
    where: { id: input.clientId },
    select: { contactEmail: true, contactPhone: true },
  });
  if (!client) return;

  const recipient: NotificationRecipient = { clientId: input.clientId };

  await recordAndSend(input, recipient, "EMAIL", async () => ({
    ok: await sendEmail(client.contactEmail, input.title, input.body, input.companyId, input.emailAttachments),
  }));

  if (input.whatsapp) {
    const phone = input.whatsappPhoneOverride ?? client.contactPhone;
    await sendWhatsAppIfPossible(input, recipient, input.whatsapp, phone, input.companyId);
  }
}
