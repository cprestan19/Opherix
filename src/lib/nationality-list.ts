/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

/**
 * Lista de nacionalidades para el formulario de postulación (§ selector, no
 * texto libre). Prioriza Latinoamérica/Caribe — mercado principal de Opherix
 * (ver CLAUDE.md §9.6, reglas de pago por país) — más otras comunes. "Otra"
 * cierra la lista para no bloquear ningún caso no contemplado.
 */
export const nationalityValues = [
  "Panameña",
  "Colombiana",
  "Dominicana",
  "Guatemalteca",
  "Costarricense",
  "Nicaragüense",
  "Hondureña",
  "Salvadoreña",
  "Mexicana",
  "Venezolana",
  "Ecuatoriana",
  "Peruana",
  "Boliviana",
  "Chilena",
  "Argentina",
  "Uruguaya",
  "Paraguaya",
  "Brasileña",
  "Cubana",
  "Puertorriqueña",
  "Haitiana",
  "Jamaiquina",
  "Beliceña",
  "Estadounidense",
  "Española",
  "China",
  "India",
  "Canadiense",
  "Francesa",
  "Italiana",
  "Alemana",
  "Portuguesa",
  "Otra",
] as const;

export type Nationality = (typeof nationalityValues)[number];
