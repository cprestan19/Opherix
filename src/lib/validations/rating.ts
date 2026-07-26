/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { z } from "zod";

export const submitEventRatingSchema = z.object({
  score: z.number().int("La calificación debe ser un número entero.").min(1).max(5),
  comment: z.string().trim().max(2000, "El comentario es demasiado largo.").optional(),
});

export type SubmitEventRatingInput = z.infer<typeof submitEventRatingSchema>;
