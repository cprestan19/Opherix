/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { z } from "zod";

export const createClientSchema = z.object({
  businessName: z.string().min(2, "Requerido"),
  taxId: z.string().optional(),
  contactName: z.string().min(2, "Requerido"),
  contactEmail: z.email("Correo inválido"),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
