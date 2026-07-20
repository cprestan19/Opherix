/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as configRepo from "@/repositories/config.repository";
import { logAudit } from "@/lib/audit";

export async function updatePayRules(
  companyId: string,
  actorId: string,
  country: string,
  data: { overtimeMultiplier: number; sundayMultiplier: number; holidayMultiplier: number },
) {
  const updated = await configRepo.upsertPayRuleSet(companyId, country, data);
  await logAudit({
    companyId,
    actorId,
    action: "PAY_RULES_UPDATED",
    entityType: "PayRuleSet",
    entityId: updated.id,
    metadata: data,
  });
  return updated;
}

export async function addHoliday(companyId: string, actorId: string, country: string, date: string, name: string) {
  const holiday = await configRepo.createHoliday(companyId, country, new Date(date), name);
  await logAudit({
    companyId,
    actorId,
    action: "HOLIDAY_ADDED",
    entityType: "Holiday",
    entityId: holiday.id,
    metadata: { date, name },
  });
  return holiday;
}

export async function removeHoliday(companyId: string, actorId: string, holidayId: string) {
  await configRepo.deleteHoliday(holidayId);
  await logAudit({ companyId, actorId, action: "HOLIDAY_REMOVED", entityType: "Holiday", entityId: holidayId });
}
