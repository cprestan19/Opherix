/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  APPLICATION_SUBMITTED: "envió una postulación",
  APPLICATION_APPROVED: "aprobó una postulación",
  APPLICATION_REJECTED: "rechazó una postulación",
  EVENT_REQUESTED: "solicitó un evento",
  EVENT_CONFIRMED: "confirmó un evento",
  EVENT_CANCELLED: "canceló un evento",
  WORKER_ASSIGNED: "asignó personal a un evento",
  ASSIGNMENT_ACCEPTED: "aceptó una asignación",
  ASSIGNMENT_REJECTED: "rechazó una asignación",
  ASSIGNMENT_CANCELLED: "canceló una asignación",
  CHECK_IN: "registró su entrada",
  CHECK_OUT: "registró su salida",
  PAYMENTS_CALCULATED: "calculó pagos del periodo",
  PAYMENT_MARKED_PAID: "registró un pago",
  PAYMENT_ADJUSTED: "ajustó un pago",
  INVOICE_ISSUED: "emitió una factura",
  INVOICE_PAID: "registró el pago de una factura",
  CLIENT_CREATED: "creó una cuenta cliente",
  DOCUMENT_UPLOADED: "subió un documento",
  WORKER_RATED: "calificó a un trabajador",
  TIME_OFF_REQUESTED: "solicitó una ausencia",
  TIME_OFF_APPROVED: "aprobó una ausencia",
  TIME_OFF_REJECTED: "rechazó una ausencia",
  PASSWORD_RESET: "restableció su contraseña",
};

export function formatAuditAction(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action.toLowerCase().replace(/_/g, " ");
}

export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}
