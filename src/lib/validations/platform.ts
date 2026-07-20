/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(2, "Requerido"),
  slug: z
    .string()
    .min(2, "Requerido")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  country: z
    .string()
    .length(2, "Usa el código ISO de 2 letras (ej. PA, CO, DO, GT)")
    .toUpperCase(),
  adminName: z.string().min(2, "Requerido"),
  adminEmail: z.email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
