/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { z } from "zod";
import { specialtyValues } from "@/lib/validations/worker-application";

const eventBaseFields = z.object({
  title: z.string().min(2, "Ingresa un título para el evento"),
  eventType: z.string().optional(),
  address: z.string().min(3, "Ingresa la ubicación del evento"),
  startAt: z.string().min(1, "Requerido"),
  endAt: z.string().min(1, "Requerido"),
  notes: z.string().optional(),
  staffRequirements: z
    .array(
      z.object({
        specialty: z.enum(specialtyValues),
        quantity: z.number().int().min(1, "Mínimo 1").max(500, "Máximo 500 por tipo de personal"),
      }),
    )
    .min(1, "Indica al menos un tipo de personal"),
  // Selección opcional del selector de personal en línea (§ /solicitar/
  // [companySlug] y /solicitar/[companySlug]/cliente/[token]) — preferencia
  // del cliente, nunca reemplaza la asignación real que hace el Administrador.
  preferredWorkerIds: z.array(z.string()).max(100).optional(),
});

/**
 * Misma regla que valida event.service.ts al guardar (endAt debe ser
 * posterior a startAt) — se repite aquí para que el formulario la muestre
 * de inmediato en el campo "Fin" en vez de que el usuario se entere recién
 * después de un viaje al servidor (§ bug reportado: datetime-local de
 * algunos navegadores puede dejar un campo con la fecha equivocada sin que
 * se note a simple vista).
 */
function checkEndAfterStart(data: { startAt: string; endAt: string }, ctx: z.RefinementCtx) {
  if (!data.startAt || !data.endAt) return;
  const start = new Date(data.startAt);
  const end = new Date(data.endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
  if (end <= start) {
    ctx.addIssue({
      code: "custom",
      message: "La hora de fin debe ser posterior a la de inicio.",
      path: ["endAt"],
    });
  }
}

export const eventRequestSchema = eventBaseFields.superRefine(checkEndAfterStart);

export type EventRequestInput = z.infer<typeof eventBaseFields>;

/**
 * Creación/edición desde el portal Administrador — a diferencia de la
 * solicitud del Cliente (que ya tiene su propio clientId resuelto de la
 * sesión), el admin elige explícitamente a qué cliente pertenece el evento.
 */
export const adminEventSchema = eventBaseFields
  .extend({ clientId: z.string().min(1, "Selecciona un cliente") })
  .superRefine(checkEndAfterStart);

export type AdminEventInput = z.infer<typeof eventBaseFields> & { clientId: string };
