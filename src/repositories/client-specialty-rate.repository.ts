/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import type { Specialty } from "@/generated/prisma/enums";

export function listRatesForClient(companyId: string, clientId: string) {
  return prisma.clientSpecialtyRate.findMany({ where: { companyId, clientId } });
}

export function listRatesForCompany(companyId: string) {
  return prisma.clientSpecialtyRate.findMany({ where: { companyId } });
}

export async function upsertRatesForClient(
  companyId: string,
  clientId: string,
  rates: { specialty: Specialty; payToWorker: number; chargeToClient: number }[],
) {
  return prisma.$transaction(
    rates.map((rate) =>
      prisma.clientSpecialtyRate.upsert({
        where: { clientId_specialty: { clientId, specialty: rate.specialty } },
        create: {
          companyId,
          clientId,
          specialty: rate.specialty,
          payToWorker: rate.payToWorker,
          chargeToClient: rate.chargeToClient,
        },
        update: {
          payToWorker: rate.payToWorker,
          chargeToClient: rate.chargeToClient,
        },
      }),
    ),
  );
}
