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
  businessName: z.string().min(2, "Ingresa el nombre de la empresa"),
  taxId: z.string().trim().optional(),
  operationRegistration: z.object({ url: z.string(), name: z.string() }).optional(),
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
        quantity: z.number().int().min(1, "Mínimo 1").max(500, "Máximo 500 por tipo de personal"),
      }),
    )
    .min(1, "Indica al menos un tipo de personal"),
  // Selección opcional del selector de personal en línea — nunca reemplaza
  // "Personal requerido" (staffNeeded), que sigue siendo obligatorio.
  preferredWorkerIds: z.array(z.string()).max(100).optional(),
  turnstileToken: z.string().optional(),
});

export type PublicEventRequestInput = z.infer<typeof publicEventRequestSchema>;
