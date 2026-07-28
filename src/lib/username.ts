/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

/**
 * Candidato de username a partir del nombre completo (§ /admin/personal "Dar
 * acceso al portal"): primera letra del primer nombre + último apellido,
 * sin acentos/espacios. Pura — no valida unicidad, eso lo resuelve quien
 * llame (ver worker.service.ts) probando este valor y, si ya existe,
 * agregando un sufijo numérico.
 */
export function buildUsernameCandidate(fullName: string): string {
  const normalized = fullName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos (diacríticos combinados tras NFD)
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .trim();

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "usuario";

  const firstInitial = parts[0][0];
  const lastName = parts[parts.length - 1];
  const candidate = parts.length === 1 ? parts[0] : `${firstInitial}${lastName}`;

  return candidate || "usuario";
}
