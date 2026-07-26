/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const PENDING_STATES = new Set(["PENDING_REVIEW", "REJECTED"]);

/**
 * Guard para subpáginas del portal Trabajador que requieren que la máquina de
 * estados Aspirante -> Trabajador ya haya llegado a APPROVED/ACTIVE (CLAUDE.md §5).
 * Aspirantes en PENDING_REVIEW/REJECTED son redirigidos a su página de estado.
 */
export async function requireActiveWorker() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "WORKER" && session.user.role !== "APPLICANT") {
    redirect("/login");
  }
  if (!session.user.workerStatus || PENDING_STATES.has(session.user.workerStatus)) {
    redirect("/trabajador/postulacion");
  }
  return session.user;
}
