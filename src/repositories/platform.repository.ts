/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export function listCompanies() {
  return prisma.company.findMany({
    include: {
      _count: { select: { users: true, workers: true, clients: true, events: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function findCompanyBySlug(slug: string) {
  return prisma.company.findUnique({ where: { slug } });
}

export function createCompanyWithAdmin(data: {
  name: string;
  slug: string;
  country: string;
  adminName: string;
  adminEmail: string;
  passwordHash: string;
}) {
  return prisma.company.create({
    data: {
      name: data.name,
      slug: data.slug,
      country: data.country,
      users: {
        create: {
          name: data.adminName,
          email: data.adminEmail.toLowerCase(),
          passwordHash: data.passwordHash,
          role: "ADMIN",
          status: "ACTIVE",
        },
      },
    },
    include: { users: true },
  });
}

export function getPlatformStats() {
  return Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { isActive: true } }),
    prisma.worker.count(),
    prisma.event.count(),
  ]);
}

export function setCompanyActive(companyId: string, isActive: boolean) {
  return prisma.company.update({ where: { id: companyId }, data: { isActive } });
}

export function findCompanyById(companyId: string) {
  return prisma.company.findUnique({ where: { id: companyId } });
}

// Borrado real: cascada a nivel de BD (onDelete: Cascade en todo lo que
// cuelga de companyId) elimina de forma permanente usuarios, trabajadores,
// clientes, eventos, pagos, documentos y auditoría de esta empresa.
export function deleteCompany(companyId: string) {
  return prisma.company.delete({ where: { id: companyId } });
}

export function listPlatformAdmins() {
  return prisma.platformAdmin.findMany({ orderBy: { createdAt: "asc" } });
}

export function findPlatformAdminByEmail(email: string) {
  return prisma.platformAdmin.findUnique({ where: { email: email.toLowerCase() } });
}

export function createPlatformAdmin(data: { name: string; email: string; passwordHash: string }) {
  return prisma.platformAdmin.create({
    data: { name: data.name, email: data.email.toLowerCase(), passwordHash: data.passwordHash },
  });
}

export function deletePlatformAdmin(id: string) {
  return prisma.platformAdmin.delete({ where: { id } });
}

export function countPlatformAdmins() {
  return prisma.platformAdmin.count();
}

export function listCrossTenantActivity(take = 100) {
  return prisma.auditLog.findMany({
    include: {
      company: { select: { name: true } },
      actor: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function listPlatformAuditLog(take = 50) {
  return prisma.platformAuditLog.findMany({ orderBy: { createdAt: "desc" }, take });
}

export function createPlatformAuditLog(data: {
  actorId?: string;
  actorEmail?: string;
  action: string;
  companyId: string;
  companyName: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.platformAuditLog.create({ data });
}

