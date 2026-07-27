/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";

let globalTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getGlobalTransporter() {
  if (!process.env.EMAIL_SERVER_HOST) return null;
  if (!globalTransporter) {
    globalTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
      auth: process.env.EMAIL_SERVER_USER
        ? { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD }
        : undefined,
    });
  }
  return globalTransporter;
}

/**
 * Config SMTP propia del tenant (§ Configuración > Correo, Company.smtp*) —
 * si el tenant no configuró la suya, se cae al SMTP global de la
 * plataforma (EMAIL_SERVER_* en variables de entorno). No se cachea (a
 * diferencia del transporter global): el volumen de notificaciones por
 * tenant es bajo y así los cambios de config se reflejan sin reiniciar.
 */
async function getCompanyTransporter(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      smtpHost: true,
      smtpPort: true,
      smtpUser: true,
      smtpPasswordEncrypted: true,
      smtpFromEmail: true,
      smtpFromName: true,
    },
  });
  if (!company?.smtpHost || !company.smtpUser || !company.smtpPasswordEncrypted) return null;

  const transporter = nodemailer.createTransport({
    host: company.smtpHost,
    port: company.smtpPort ?? 587,
    auth: { user: company.smtpUser, pass: decryptSecret(company.smtpPasswordEncrypted) },
  });

  const from = company.smtpFromName
    ? `${company.smtpFromName} <${company.smtpFromEmail ?? company.smtpUser}>`
    : (company.smtpFromEmail ?? company.smtpUser);

  return { transporter, from };
}

export async function sendEmail(to: string, subject: string, body: string, companyId?: string): Promise<boolean> {
  const companyConfig = companyId ? await getCompanyTransporter(companyId) : null;
  const client = companyConfig?.transporter ?? getGlobalTransporter();
  const from = companyConfig?.from ?? process.env.EMAIL_FROM ?? "notificaciones@opherix.app";

  if (!client) {
    console.info(`[email:no-op] Sin SMTP configurado — se omite envío a ${to}: ${subject}`);
    return false;
  }

  try {
    // Solo campos básicos (to/from/subject/text) — se evita a propósito
    // jsonTransport, `raw`, headers List-*, envelope.size y OAuth2, que son
    // las superficies afectadas por los CVEs conocidos de nodemailer.
    await client.sendMail({ from, to, subject, text: body });
    return true;
  } catch (error) {
    console.error("[email] Error enviando correo:", error);
    return false;
  }
}
