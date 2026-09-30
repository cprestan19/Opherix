/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

export function listActiveSpecialties(companyId: string) {
  return prisma.specialty.findMany({
    where: { companyId, archivedAt: null },
    orderBy: { name: "asc" },
  });
}

/** Incluye archivadas — para el panel de mantenimiento en Configuración. */
export function listAllSpecialties(companyId: string) {
  return prisma.specialty.findMany({
    where: { companyId },
    orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
  });
}

/**
 * Valida que los IDs recibidos realmente pertenezcan a esta empresa y estén
 * activos, antes de persistirlos — necesario porque varios formularios que
 * envían specialtyId son públicos y sin sesión (§ /solicitar/[companySlug]).
 * Devuelve solo los que existen/pertenecen/están activos; el llamador
 * rechaza si el tamaño no coincide con lo enviado.
 */
export function findActiveSpecialtiesByIds(companyId: string, ids: string[]) {
  if (ids.length === 0) return Promise.resolve([]);
  return prisma.specialty.findMany({
    where: { companyId, archivedAt: null, id: { in: ids } },
  });
}

export function findSpecialtyByName(companyId: string, name: string) {
  return prisma.specialty.findFirst({
    where: { companyId, name: { equals: name, mode: "insensitive" } },
  });
}

export function createSpecialty(companyId: string, name: string) {
  return prisma.specialty.create({ data: { companyId, name } });
}

export async function renameSpecialty(companyId: string, id: string, name: string) {
  const result = await prisma.specialty.updateMany({ where: { id, companyId }, data: { name } });
  if (result.count === 0) return null;
  return prisma.specialty.findUniqueOrThrow({ where: { id } });
}

export async function archiveSpecialty(companyId: string, id: string) {
  const result = await prisma.specialty.updateMany({ where: { id, companyId }, data: { archivedAt: new Date() } });
  if (result.count === 0) return null;
  return prisma.specialty.findUniqueOrThrow({ where: { id } });
}

export async function restoreSpecialty(companyId: string, id: string) {
  const result = await prisma.specialty.updateMany({ where: { id, companyId }, data: { archivedAt: null } });
  if (result.count === 0) return null;
  return prisma.specialty.findUniqueOrThrow({ where: { id } });
}

export function findSpecialtyById(companyId: string, id: string) {
  return prisma.specialty.findFirst({ where: { id, companyId } });
}
