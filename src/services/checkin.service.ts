/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import type { CheckMethod } from "@/generated/prisma/enums";
import * as checkinRepo from "@/repositories/checkin.repository";
import { verifyCheckInCode } from "@/lib/checkin-code";
import { logAudit } from "@/lib/audit";

export class CheckInError extends Error {}

export interface CheckMethodPayload {
  method: CheckMethod;
  lat?: number;
  lng?: number;
  photoUrl?: string;
  code?: string;
}

async function validatePayload(eventId: string, payload: CheckMethodPayload) {
  if (payload.method === "SUPERVISOR_CODE" || payload.method === "QR") {
    if (!verifyCheckInCode(eventId, payload.code ?? "")) {
      throw new CheckInError("Código inválido o vencido.");
    }
  }
  if (payload.method === "SELFIE" && !payload.photoUrl) {
    throw new CheckInError("Falta la foto de verificación.");
  }
  if (payload.method === "GPS" && (payload.lat === undefined || payload.lng === undefined)) {
    throw new CheckInError("No se pudo obtener tu ubicación.");
  }
}

export async function checkIn(
  companyId: string,
  workerId: string,
  assignmentId: string,
  payload: CheckMethodPayload,
) {
  const assignment = await checkinRepo.findAssignmentForWorker(assignmentId, workerId);
  if (!assignment) throw new CheckInError("Asignación no encontrada.");
  if (assignment.status !== "ACCEPTED") throw new CheckInError("Esta asignación no está confirmada.");
  if (assignment.checkInAt) throw new CheckInError("Ya registraste tu entrada.");

  await validatePayload(assignment.eventId, payload);

  const updated = await checkinRepo.recordCheckIn(assignmentId, {
    method: payload.method,
    lat: payload.lat,
    lng: payload.lng,
    photoUrl: payload.photoUrl,
  });

  await checkinRepo.markEventInProgress(assignment.eventId);

  await logAudit({
    companyId,
    actorId: workerId,
    action: "CHECK_IN",
    entityType: "WorkerAssignment",
    entityId: assignmentId,
    metadata: { method: payload.method },
  });

  return updated;
}

export async function checkOut(
  companyId: string,
  workerId: string,
  assignmentId: string,
  payload: CheckMethodPayload,
) {
  const assignment = await checkinRepo.findAssignmentForWorker(assignmentId, workerId);
  if (!assignment) throw new CheckInError("Asignación no encontrada.");
  if (!assignment.checkInAt) throw new CheckInError("Primero debes registrar tu entrada.");
  if (assignment.checkOutAt) throw new CheckInError("Ya registraste tu salida.");

  await validatePayload(assignment.eventId, payload);

  const updated = await checkinRepo.recordCheckOut(assignmentId, {
    method: payload.method,
    lat: payload.lat,
    lng: payload.lng,
    photoUrl: payload.photoUrl,
  });

  const openAssignments = await checkinRepo.countOpenAssignments(assignment.eventId);
  if (openAssignments === 0) {
    await checkinRepo.markEventCompleted(assignment.eventId);
  }

  await logAudit({
    companyId,
    actorId: workerId,
    action: "CHECK_OUT",
    entityType: "WorkerAssignment",
    entityId: assignmentId,
    metadata: { method: payload.method },
  });

  return updated;
}
