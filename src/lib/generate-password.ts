/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { randomInt } from "crypto";

// Sin caracteres ambiguos (0/O, 1/l/I) — se va a leer/tipear a mano desde
// WhatsApp en un teléfono, no se pega desde un gestor de contraseñas.
const ALPHABET = "abcdefghjkmnpqrstuvwxyzACDEFGHJKMNPQRSTUVWXYZ23456789";
const LENGTH = 10;

/** Contraseña temporal legible (§ /admin/personal "Dar acceso al portal") — se hashea antes de guardar, nunca se persiste en claro. */
export function generateReadablePassword(): string {
  let password = "";
  for (let i = 0; i < LENGTH; i++) {
    password += ALPHABET[randomInt(ALPHABET.length)];
  }
  return password;
}
