/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/enums";

// Roles administrables desde /admin/usuarios — CLIENT/WORKER/APPLICANT se
// crean por sus propios flujos (solicitud pública, postulación) y no deben
// aparecer ni ser editables aquí.
export const COMPANY_STAFF_ROLES: UserRole[] = ["ADMIN", "SUPERVISOR", "VIEWER"];

export function listCompanyUsers(companyId: string) {
  return prisma.user.findMany({
    where: { companyId, role: { in: COMPANY_STAFF_ROLES } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

export function findCompanyUserById(companyId: string, userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, companyId, role: { in: COMPANY_STAFF_ROLES } },
  });
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export function createCompanyUser(data: {
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      role: data.role,
      passwordHash: data.passwordHash,
      status: "ACTIVE",
    },
  });
}

export async function setCompanyUserRole(companyId: string, userId: string, role: UserRole) {
  const result = await prisma.user.updateMany({
    where: { id: userId, companyId, role: { in: COMPANY_STAFF_ROLES } },
    data: { role },
  });
  if (result.count === 0) return null;
  return prisma.user.findUniqueOrThrow({ where: { id: userId } });
}

export async function setCompanyUserStatus(companyId: string, userId: string, status: "ACTIVE" | "SUSPENDED") {
  const result = await prisma.user.updateMany({
    where: { id: userId, companyId, role: { in: COMPANY_STAFF_ROLES } },
    data: { status, ...(status === "ACTIVE" ? { failedLoginAttempts: 0, lockedUntil: null } : {}) },
  });
  if (result.count === 0) return null;
  return prisma.user.findUniqueOrThrow({ where: { id: userId } });
}
