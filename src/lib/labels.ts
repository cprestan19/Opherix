/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import type { DocumentType, WorkerStatus } from "@/generated/prisma/enums";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ID_CARD: "Cédula",
  RESUME: "Currículum",
  HEALTH_CARD: "Carnet de salud",
  FOOD_HANDLING: "Manipulación de alimentos",
  LICENSE: "Licencia",
  CERTIFICATE: "Certificado",
  OTHER: "Otro",
};

export const WORKER_STATUS_LABELS: Record<WorkerStatus, string> = {
  PENDING_REVIEW: "Pendiente de revisión",
  APPROVED: "Aprobado",
  ACTIVE: "Activo",
  REJECTED: "Rechazado",
  INACTIVE: "Inactivo",
};
