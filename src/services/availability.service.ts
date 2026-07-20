/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import * as availabilityRepo from "@/repositories/availability.repository";
import { logAudit } from "@/lib/audit";

export class AvailabilityError extends Error {}

export async function toggleSlot(
  workerId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
) {
  const existing = await availabilityRepo.findSlot(workerId, dayOfWeek, startTime, endTime);
  if (existing) {
    await availabilityRepo.deleteSlot(existing.id);
    return { active: false };
  }
  await availabilityRepo.createSlot(workerId, dayOfWeek, startTime, endTime);
  return { active: true };
}

export async function requestTimeOff(
  companyId: string,
  workerId: string,
  actorId: string,
  input: { type: "VACATION" | "PERMIT" | "ABSENCE"; startDate: string; endDate: string; reason?: string },
) {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  if (endDate < startDate) {
    throw new AvailabilityError("La fecha de fin no puede ser anterior a la de inicio.");
  }
  const timeOff = await availabilityRepo.createTimeOff({
    workerId,
    type: input.type,
    startDate,
    endDate,
    reason: input.reason,
  });

  await logAudit({
    companyId,
    actorId,
    action: "TIME_OFF_REQUESTED",
    entityType: "TimeOff",
    entityId: timeOff.id,
    metadata: { type: input.type },
  });

  return timeOff;
}

export async function reviewTimeOff(
  companyId: string,
  timeOffId: string,
  actorId: string,
  decision: "APPROVED" | "REJECTED",
) {
  const updated = await availabilityRepo.updateTimeOffStatus(timeOffId, decision);
  await logAudit({
    companyId,
    actorId,
    action: decision === "APPROVED" ? "TIME_OFF_APPROVED" : "TIME_OFF_REJECTED",
    entityType: "TimeOff",
    entityId: timeOffId,
  });
  return updated;
}
