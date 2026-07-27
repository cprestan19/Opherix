/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { z } from "zod";

export const companyUserRoleValues = ["ADMIN", "SUPERVISOR", "VIEWER"] as const;

export const companyUserRoleLabels: Record<(typeof companyUserRoleValues)[number], string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  VIEWER: "Usuario (solo lectura)",
};

export const companyUserRoleDescriptions: Record<(typeof companyUserRoleValues)[number], string> = {
  ADMIN: "Acceso total al portal de la empresa, incluida Configuración.",
  SUPERVISOR: "Todo el portal excepto Configuración.",
  VIEWER: "Solo lectura — sin acceso a Pagos y sin poder crear, editar ni aprobar nada.",
};

export const createCompanyUserSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre completo").max(120),
  email: z.email("Correo inválido"),
  phone: z.string().trim().max(30).optional(),
  role: z.enum(companyUserRoleValues),
});

export type CreateCompanyUserInput = z.infer<typeof createCompanyUserSchema>;

export const editCompanyUserSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre completo").max(120),
  email: z.email("Correo inválido"),
  phone: z.string().trim().max(30).optional(),
});

export type EditCompanyUserInput = z.infer<typeof editCompanyUserSchema>;
