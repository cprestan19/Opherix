/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { z } from "zod";
import { specialtyValues } from "@/lib/validations/worker-application";

export const publicEventRequestSchema = z.object({
  contactName: z.string().min(2, "Ingresa tu nombre completo"),
  contactEmail: z.email("Correo inválido"),
  contactPhone: z.string().min(6, "Ingresa un teléfono válido"),
  eventTitle: z.string().min(2, "Ingresa un título para el evento"),
  eventType: z.string().optional(),
  address: z.string().min(3, "Ingresa la ubicación del evento"),
  startAt: z.string().min(1, "Requerido"),
  endAt: z.string().min(1, "Requerido"),
  notes: z.string().optional(),
  staffNeeded: z
    .array(
      z.object({
        specialty: z.enum(specialtyValues),
        quantity: z.number().int().min(1, "Mínimo 1"),
      }),
    )
    .min(1, "Indica al menos un tipo de personal"),
  turnstileToken: z.string().optional(),
});

export type PublicEventRequestInput = z.infer<typeof publicEventRequestSchema>;
