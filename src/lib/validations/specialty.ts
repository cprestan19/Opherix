/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { z } from "zod";

export const specialtyNameSchema = z.object({
  name: z.string().trim().min(2, "Ingresa un nombre").max(60, "Máximo 60 caracteres"),
});

export const renameSpecialtySchema = specialtyNameSchema.extend({
  id: z.string().min(1),
});

export const specialtyIdSchema = z.object({
  id: z.string().min(1),
});

export type CreateSpecialtyInput = z.infer<typeof specialtyNameSchema>;
export type RenameSpecialtyInput = z.infer<typeof renameSpecialtySchema>;
export type SpecialtyIdInput = z.infer<typeof specialtyIdSchema>;
