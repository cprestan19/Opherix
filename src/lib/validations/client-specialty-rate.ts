/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { z } from "zod";
import { specialtyValues } from "@/lib/validations/worker-application";

export const clientSpecialtyRateSchema = z.object({
  clientId: z.string().min(1),
  rates: z.array(
    z.object({
      specialty: z.enum(specialtyValues),
      payToWorker: z.number().min(0),
      chargeToClient: z.number().min(0),
    }),
  ),
});

export type ClientSpecialtyRateInput = z.infer<typeof clientSpecialtyRateSchema>;
