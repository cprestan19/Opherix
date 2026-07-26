/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { z } from "zod";
import { specialtyValues } from "@/lib/validations/worker-application";

export const createWorkerSchema = z.object({
  name: z.string().min(2, "Ingresa el nombre completo"),
  email: z.email("Correo inválido"),
  phone: z.string().min(6, "Ingresa un teléfono válido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  specialties: z.array(z.enum(specialtyValues)).min(1, "Selecciona al menos una especialidad"),
});

export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
