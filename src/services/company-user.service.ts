/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import * as repo from "@/repositories/company-user.repository";
import * as passwordResetRepo from "@/repositories/password-reset.repository";
import { generatePasswordResetToken } from "@/lib/password-reset-token";
import { sendEmail } from "@/lib/notifications/email";
import { logAudit } from "@/lib/audit";
import {
  companyUserRoleLabels,
  type CreateCompanyUserInput,
  type EditCompanyUserInput,
} from "@/lib/validations/company-user";
import type { UserRole } from "@/generated/prisma/enums";

export class CompanyUserError extends Error {}

/**
 * Crea una cuenta de staff (Administrador/Supervisor/Usuario) para la
 * empresa del actor. La cuenta nace con una contraseña aleatoria e
 * inutilizable (igual que el auto-aprovisionamiento de Google, ver
 * self-signup.service.ts) — el correo recibe un enlace de un solo uso
 * (mismo mecanismo que "olvidé mi contraseña") para que la persona elija
 * la suya. Nunca se genera ni se muestra una contraseña en texto plano.
 */
export async function createCompanyUser(companyId: string, actorId: string, input: CreateCompanyUserInput) {
  const existing = await repo.findUserByEmail(input.email);
  if (existing) {
    throw new CompanyUserError("Ya existe una cuenta con ese correo.");
  }

  const unusablePassword = crypto.randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(unusablePassword, 12);

  const user = await repo.createCompanyUser({
    companyId,
    name: input.name,
    email: input.email,
    phone: input.phone,
    role: input.role,
    passwordHash,
  });

  await logAudit({
    companyId,
    actorId,
    action: "COMPANY_USER_CREATED",
    entityType: "User",
    entityId: user.id,
    metadata: { role: input.role, email: user.email },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const { token, tokenHash, expiresAt } = generatePasswordResetToken();
  await passwordResetRepo.createPasswordResetToken({ tokenHash, expiresAt, userId: user.id });
  const setPasswordUrl = `${baseUrl}/reset-password?token=${token}`;

  const sent = await sendEmail(
    user.email,
    "Tu cuenta en Opherix",
    `Se creó una cuenta para ti en Opherix con el rol de ${companyUserRoleLabels[input.role]}.\n\n` +
      `Elige tu contraseña para activarla (este enlace vence en 1 hora):\n${setPasswordUrl}\n\n` +
      `Luego podrás iniciar sesión con tu correo (${user.email}) en ${baseUrl}/login.`,
  );

  if (!sent && process.env.NODE_ENV !== "production") {
    console.info(`[company-user:dev] Sin SMTP configurado — enlace para ${user.email}:\n${setPasswordUrl}`);
  }

  return user;
}

export async function listCompanyUsers(companyId: string) {
  return repo.listCompanyUsers(companyId);
}

export async function editCompanyUser(
  companyId: string,
  actorId: string,
  targetUserId: string,
  input: EditCompanyUserInput,
) {
  const target = await repo.findCompanyUserById(companyId, targetUserId);
  if (!target) {
    throw new CompanyUserError("Usuario no encontrado.");
  }

  if (input.email.toLowerCase() !== target.email.toLowerCase()) {
    const existing = await repo.findUserByEmail(input.email);
    if (existing && existing.id !== targetUserId) {
      throw new CompanyUserError("Ya existe una cuenta con ese correo.");
    }
  }

  const updated = await repo.updateCompanyUser(companyId, targetUserId, {
    name: input.name,
    email: input.email,
    phone: input.phone,
  });
  if (!updated) {
    throw new CompanyUserError("Usuario no encontrado.");
  }

  await logAudit({
    companyId,
    actorId,
    action: "COMPANY_USER_UPDATED",
    entityType: "User",
    entityId: targetUserId,
  });

  return updated;
}

/**
 * El Administrador asigna directamente la contraseña de un usuario de su
 * empresa (ej. cuando el correo de invitación no llega o prefiere entregarla
 * en persona) — a diferencia de la creación de cuenta, aquí sí se maneja una
 * contraseña en texto plano de un tercero, así que nunca se registra en
 * logs/auditoría y se hashea de inmediato. Se avisa por correo al dueño de
 * la cuenta para que note el cambio si no fue él quien lo pidió.
 */
export async function setCompanyUserPassword(
  companyId: string,
  actorId: string,
  targetUserId: string,
  password: string,
) {
  const target = await repo.findCompanyUserById(companyId, targetUserId);
  if (!target) {
    throw new CompanyUserError("Usuario no encontrado.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const ok = await repo.setCompanyUserPassword(companyId, targetUserId, passwordHash);
  if (!ok) {
    throw new CompanyUserError("Usuario no encontrado.");
  }

  await logAudit({
    companyId,
    actorId,
    action: "COMPANY_USER_PASSWORD_SET",
    entityType: "User",
    entityId: targetUserId,
  });

  await sendEmail(
    target.email,
    "Tu contraseña en Opherix fue actualizada",
    `Un administrador de tu empresa estableció una nueva contraseña para tu cuenta (${target.email}).\n\n` +
      `Si no lo esperabas, contacta a tu administrador de inmediato.`,
  );

  return true;
}

export async function setCompanyUserRole(
  companyId: string,
  actorId: string,
  targetUserId: string,
  role: UserRole,
) {
  if (targetUserId === actorId) {
    throw new CompanyUserError("No puedes cambiar tu propio rol.");
  }

  const target = await repo.findCompanyUserById(companyId, targetUserId);
  if (!target) {
    throw new CompanyUserError("Usuario no encontrado.");
  }

  const updated = await repo.setCompanyUserRole(companyId, targetUserId, role);
  if (!updated) {
    throw new CompanyUserError("Usuario no encontrado.");
  }

  await logAudit({
    companyId,
    actorId,
    action: "COMPANY_USER_ROLE_CHANGED",
    entityType: "User",
    entityId: targetUserId,
    metadata: { from: target.role, to: role },
  });

  return updated;
}

export async function setCompanyUserStatus(
  companyId: string,
  actorId: string,
  targetUserId: string,
  status: "ACTIVE" | "SUSPENDED",
) {
  if (targetUserId === actorId) {
    throw new CompanyUserError("No puedes suspender tu propia cuenta.");
  }

  // Evita dejar la empresa sin ningún ADMIN activo, que la aislaría de
  // Configuración/gestión de usuarios permanentemente.
  if (status === "SUSPENDED") {
    const target = await repo.findCompanyUserById(companyId, targetUserId);
    if (target?.role === "ADMIN") {
      const activeAdmins = await prisma.user.count({
        where: { companyId, role: "ADMIN", status: "ACTIVE", id: { not: targetUserId } },
      });
      if (activeAdmins === 0) {
        throw new CompanyUserError("Debe quedar al menos un Administrador activo en la empresa.");
      }
    }
  }

  const updated = await repo.setCompanyUserStatus(companyId, targetUserId, status);
  if (!updated) {
    throw new CompanyUserError("Usuario no encontrado.");
  }

  await logAudit({
    companyId,
    actorId,
    action: status === "ACTIVE" ? "COMPANY_USER_REACTIVATED" : "COMPANY_USER_SUSPENDED",
    entityType: "User",
    entityId: targetUserId,
  });

  return updated;
}
