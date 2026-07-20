/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

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

  await prisma.auditLog.create({
    data: {
      companyId,
      actorId,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress,
      userAgent,
    },
  });
}
