/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { z } from "zod";
import { nationalityValues } from "@/lib/nationality-list";

export const maritalStatusValues = ["SOLTERO", "CASADO", "UNION_LIBRE", "DIVORCIADO", "VIUDO"] as const;

export const maritalStatusLabels: Record<(typeof maritalStatusValues)[number], string> = {
  SOLTERO: "Soltero/a",
  CASADO: "Casado/a",
  UNION_LIBRE: "Unión libre",
  DIVORCIADO: "Divorciado/a",
  VIUDO: "Viudo/a",
};

export const languageValues = ["ESPANOL", "INGLES", "PORTUGUES"] as const;

export const languageLabels: Record<(typeof languageValues)[number], string> = {
  ESPANOL: "Español",
  INGLES: "Inglés",
  PORTUGUES: "Portugués",
};

export const specialtyValues = [
  "WAITER",
  "BARTENDER",
  "HOST",
  "COOK",
  "SECURITY",
  "CLEANING",
  "LOGISTICS",
  "OTHER",
] as const;

export const specialtyLabels: Record<(typeof specialtyValues)[number], string> = {
  WAITER: "Mesero/a",
  BARTENDER: "Bartender",
  HOST: "Anfitrión/a",
  COOK: "Ayudante de cocina",
  SECURITY: "Seguridad",
  CLEANING: "Limpieza",
  LOGISTICS: "Logística",
  OTHER: "Otro",
};

const previousEmployerSchema = z.object({
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

export const workerApplicationSchema = z
  .object({
    // Paso 1 — Datos personales
    name: z.string().min(2, "Ingresa tu nombre completo"),
    email: z.email("Correo inválido"),
    phone: z.string().min(6, "Ingresa un teléfono válido"),
    idNumber: z.string().min(5, "Ingresa tu número de cédula"),
    nationality: z.enum(nationalityValues, "Selecciona tu nacionalidad"),
    birthDate: z.string().min(1, "Requerido"),
    address: z.string().min(3, "Requerido"),
    maritalStatus: z.enum(maritalStatusValues, "Selecciona tu estado civil"),
    hasChildren: z.boolean(),
    childrenCount: z.number().int().min(0).optional(),
    photoUrl: z.string().optional(),
    idDocumentUrl: z.string().min(1, "Sube una foto de tu cédula o pasaporte"),
    idDocumentName: z.string().min(1),

    // Paso 2 — Formación y experiencia
    education: z.string().min(1, "Requerido"),
    courses: z.array(z.string()),
    languages: z.array(z.enum(languageValues)).min(1, "Indica al menos un idioma"),
    specialties: z.array(z.enum(specialtyValues)).min(1, "Selecciona al menos una especialidad"),
    experienceYears: z.number().int().min(0).max(60),
    previousEmployers: z.array(previousEmployerSchema),
    references: z.array(referenceSchema).min(1, "Indica al menos una referencia"),
    licenses: z.array(z.string()),

    // Paso 3 — Logística, salud y emergencia
    hasVehicle: z.boolean(),
    vehicleType: z.string().optional(),
    uniformShirtSize: z.string().min(1, "Requerido"),
    uniformPantsSize: z.string().min(1, "Requerido"),
    uniformShoeSize: z.string().min(1, "Requerido"),
    availableDays: z.array(z.number().int().min(0).max(6)),
    allergies: z.string().optional(),
    conditions: z.string().optional(),
    emergencyContactName: z.string().min(2, "Requerido"),
    emergencyContactPhone: z.string().min(6, "Requerido"),
    // El carnet de salud puede subirse aquí o más adelante desde el perfil.
    healthCardUrl: z.string().optional(),
    healthCardName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasVehicle && !data.vehicleType?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["vehicleType"],
        message: "Indica el tipo de vehículo",
      });
    }
  });

export type WorkerApplicationInput = z.infer<typeof workerApplicationSchema>;

/**
 * Agrupación de campos por paso del formulario (wizard de 3 pantallas).
 * Se usa con `trigger()` de react-hook-form para validar solo el paso
 * actual antes de dejar avanzar con "Continuar".
 */
export const APPLICATION_STEPS: {
  title: string;
  description: string;
  fields: (keyof WorkerApplicationInput)[];
}[] = [
  {
    title: "Datos personales",
    description: "Quién eres y cómo contactarte.",
    fields: [
      "name",
      "email",
      "phone",
      "idNumber",
      "nationality",
      "birthDate",
      "address",
      "maritalStatus",
      "childrenCount",
      "photoUrl",
      "idDocumentUrl",
      "idDocumentName",
    ],
  },
  {
    title: "Formación y experiencia",
    description: "Tu preparación y trayectoria laboral.",
    fields: [
      "education",
      "courses",
      "languages",
      "specialties",
      "experienceYears",
      "previousEmployers",
      "references",
      "licenses",
    ],
  },
  {
    title: "Logística, salud y emergencia",
    description: "Últimos detalles antes de enviar tu postulación.",
    fields: [
      "hasVehicle",
      "vehicleType",
      "uniformShirtSize",
      "uniformPantsSize",
      "uniformShoeSize",
      "availableDays",
      "allergies",
      "conditions",
      "emergencyContactName",
      "emergencyContactPhone",
      "healthCardUrl",
      "healthCardName",
    ],
  },
];
