/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.EMAIL_SERVER_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
      auth: process.env.EMAIL_SERVER_USER
        ? { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD }
        : undefined,
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  const client = getTransporter();
  if (!client) {
    console.info(`[email:no-op] EMAIL_SERVER_HOST no configurado — se omite envío a ${to}: ${subject}`);
    return false;
  }

  try {
    // Solo campos básicos (to/from/subject/text) — se evita a propósito
    // jsonTransport, `raw`, headers List-*, envelope.size y OAuth2, que son
    // las superficies afectadas por los CVEs conocidos de nodemailer.
    await client.sendMail({
      from: process.env.EMAIL_FROM ?? "notificaciones@operix.app",
      to,
      subject,
      text: body,
    });
    return true;
  } catch (error) {
    console.error("[email] Error enviando correo:", error);
    return false;
  }
}
