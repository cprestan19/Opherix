/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications/email";
import { sendPushNotification } from "@/lib/notifications/push";

export interface DispatchNotificationInput {
  companyId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

async function recordAndSend(
  input: DispatchNotificationInput,
  channel: "EMAIL" | "PUSH",
  send: () => Promise<boolean>,
) {
  const notification = await prisma.notification.create({
    data: {
      companyId: input.companyId,
      userId: input.userId,
      channel,
      type: input.type,
      title: input.title,
      body: input.body,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
    },
  });

  const sent = await send();

  await prisma.notification.update({
    where: { id: notification.id },
    data: { status: sent ? "SENT" : "FAILED", sentAt: sent ? new Date() : null },
  });

  return sent;
}

export async function dispatchNotification(input: DispatchNotificationInput) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, fcmToken: true },
  });
  if (!user) return;

  await recordAndSend(input, "EMAIL", () => sendEmail(user.email, input.title, input.body));

  if (user.fcmToken) {
    await recordAndSend(input, "PUSH", () => sendPushNotification(user.fcmToken, input.title, input.body));
  }
}
