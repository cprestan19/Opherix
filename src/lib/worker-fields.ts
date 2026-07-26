/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

export interface WorkerEmployer {
  company: string;
  role: string;
  from: string;
  to?: string;
  // Referencia de ese trabajo específico (ej. su jefe ahí) — va debajo de
  // cada empresa anterior, no como una lista de referencias aparte.
  referenceName?: string;
  referencePhone?: string;
  referenceRelation?: string;
}

export interface WorkerUniformSizes {
  shirt: string;
  pants: string;
  shoes: string;
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function asEmployers(value: unknown): WorkerEmployer[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is WorkerEmployer => typeof v === "object" && v !== null && "company" in v && "role" in v,
  );
}

export function asUniformSizes(value: unknown): WorkerUniformSizes {
  if (typeof value === "object" && value !== null) {
    const v = value as Record<string, unknown>;
    return {
      shirt: typeof v.shirt === "string" ? v.shirt : "",
      pants: typeof v.pants === "string" ? v.pants : "",
      shoes: typeof v.shoes === "string" ? v.shoes : "",
    };
  }
  return { shirt: "", pants: "", shoes: "" };
}
