/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export function findPlatformAdminByEmail(email: string) {
  return prisma.platformAdmin.findUnique({ where: { email: email.toLowerCase() } });
}

export function findUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, companyId: true } });
}

export function createPasswordResetToken(data: {
  tokenHash: string;
  expiresAt: Date;
  userId?: string;
  platformAdminId?: string;
}) {
  return prisma.passwordResetToken.create({ data });
}

export function findValidPasswordResetToken(tokenHash: string) {
  return prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
  });
}

export function markPasswordResetTokenUsed(id: string) {
  return prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
}

export function updateUserPassword(userId: string, passwordHash: string) {
  return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export function updatePlatformAdminPassword(platformAdminId: string, passwordHash: string) {
  return prisma.platformAdmin.update({ where: { id: platformAdminId }, data: { passwordHash } });
}
