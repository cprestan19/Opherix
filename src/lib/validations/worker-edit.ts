/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { z } from "zod";
import { specialtyValues } from "@/lib/validations/worker-application";

const employerSchema = z.object({
  company: z.string().min(1, "Requerido"),
  role: z.string().min(1, "Requerido"),
  from: z.string().min(1, "Requerido"),
  to: z.string().optional(),
});

const referenceSchema = z.object({
  name: z.string().min(1, "Requerido"),
  phone: z.string().min(1, "Requerido"),
  relation: z.string().min(1, "Requerido"),
});

export const workerEditSchema = z.object({
  // Cuenta (User)
  name: z.string().min(2, "Ingresa el nombre completo"),
  email: z.email("Correo inválido"),
  phone: z.string().min(6, "Ingresa un teléfono válido"),

  // Datos personales (Worker)
  idNumber: z.string().min(1, "Requerido"),
  nationality: z.string().min(1, "Requerido"),
  birthDate: z.string().min(1, "Requerido"),
  address: z.string().min(1, "Requerido"),
  maritalStatus: z.string().min(1, "Requerido"),
  hasChildren: z.boolean(),
  childrenCount: z.number().int().min(0).optional(),
  photoUrl: z.string().optional(),

  // Formación y experiencia
  education: z.string().min(1, "Requerido"),
  courses: z.array(z.string()),
  languages: z.array(z.string()).min(1, "Indica al menos un idioma"),
  specialties: z.array(z.enum(specialtyValues)).min(1, "Selecciona al menos una especialidad"),
  experienceYears: z.number().int().min(0).max(60),
  previousEmployers: z.array(employerSchema),
  references: z.array(referenceSchema),
  licenses: z.array(z.string()),

  // Laboral
  hourlyRate: z.number().min(0).optional(),
  hasVehicle: z.boolean(),
  vehicleType: z.string().optional(),
  uniformShirtSize: z.string().min(1, "Requerido"),
  uniformPantsSize: z.string().min(1, "Requerido"),
  uniformShoeSize: z.string().min(1, "Requerido"),

  // Emergencia
  emergencyContactName: z.string().min(1, "Requerido"),
  emergencyContactPhone: z.string().min(1, "Requerido"),

  // Salud confidencial
  allergies: z.string().optional(),
  conditions: z.string().optional(),
});

export type WorkerEditInput = z.infer<typeof workerEditSchema>;
