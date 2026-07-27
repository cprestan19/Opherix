/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { z } from "zod";

// smtpPassword vacío significa "no cambiar la contraseña guardada" — solo se
// actualiza cuando el admin escribe una nueva (§ config.service.ts).
export const emailConfigSchema = z.object({
  smtpHost: z.string().min(1, "Requerido"),
  smtpPort: z.number().int().min(1).max(65535),
  smtpUser: z.string().min(1, "Requerido"),
  smtpPassword: z.string().optional(),
  smtpFromEmail: z.email("Correo inválido"),
  smtpFromName: z.string().optional(),
});

export type EmailConfigInput = z.infer<typeof emailConfigSchema>;
