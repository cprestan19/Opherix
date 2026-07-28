/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { z } from "zod";
import { specialtyValues } from "@/lib/validations/worker-application";

export const eventRequestSchema = z.object({
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

export type EventRequestInput = z.infer<typeof eventRequestSchema>;

/**
 * Creación/edición desde el portal Administrador — a diferencia de la
 * solicitud del Cliente (que ya tiene su propio clientId resuelto de la
 * sesión), el admin elige explícitamente a qué cliente pertenece el evento.
 */
export const adminEventSchema = eventRequestSchema.extend({
  clientId: z.string().min(1, "Selecciona un cliente"),
});

export type AdminEventInput = z.infer<typeof adminEventSchema>;
