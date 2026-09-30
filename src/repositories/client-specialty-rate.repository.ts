/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { prisma } from "@/lib/prisma";

export function listRatesForClient(companyId: string, clientId: string) {
  return prisma.clientSpecialtyRate.findMany({ where: { companyId, clientId }, include: { specialty: true } });
}

export function listRatesForCompany(companyId: string) {
  return prisma.clientSpecialtyRate.findMany({ where: { companyId }, include: { specialty: true } });
}

export async function upsertRatesForClient(
  companyId: string,
  clientId: string,
  rates: { specialtyId: string; payToWorker: number; chargeToClient: number }[],
) {
  return prisma.$transaction(
    rates.map((rate) =>
      prisma.clientSpecialtyRate.upsert({
        where: { clientId_specialtyId: { clientId, specialtyId: rate.specialtyId } },
        create: {
          companyId,
          clientId,
          specialtyId: rate.specialtyId,
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
