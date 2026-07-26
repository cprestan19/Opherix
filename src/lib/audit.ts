/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

interface LogAuditParams {
  companyId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Registro transversal de auditoría (§9.9). Toda acción de negocio relevante
 * (aprobar aspirante, asignar personal, aprobar pago, editar tarifa, etc.)
 * debe pasar por aquí en vez de logs dispersos por módulo.
 */
export async function logAudit({
  companyId,
  actorId,
  action,
  entityType,
  entityId,
  metadata,
}: LogAuditParams) {
  const headerList = await headers();
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    undefined;
  const userAgent = headerList.get("user-agent") ?? undefined;

  const data = {
    companyId,
    actorId,
    action,
    entityType,
    entityId,
    metadata,
    ipAddress,
    userAgent,
  };

  try {
    await prisma.auditLog.create({ data });
  } catch (error) {
    // La sesión (JWT) puede sobrevivir a un usuario que ya no existe en BD
    // (p.ej. reseed/reset de la BD de desarrollo con la cookie de sesión aún
    // vigente, o una cuenta borrada entre el login y esta acción). La
    // auditoría es transversal y de mejor esfuerzo (§9.9) — no debe abortar
    // la operación de negocio que la disparó. Se reintenta sin actor.
    const isOrphanedActor =
      actorId !== null &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003" &&
      (error.message.includes("actorId") || JSON.stringify(error.meta ?? {}).includes("actorId"));

    if (!isOrphanedActor) throw error;

    await prisma.auditLog.create({ data: { ...data, actorId: null } });
  }
}
