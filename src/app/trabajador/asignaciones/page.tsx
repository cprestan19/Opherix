/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { requireActiveWorker } from "@/lib/worker-guard";
import { getWorkerIdForUser } from "@/repositories/availability.repository";
import { listAssignmentsForWorker } from "@/repositories/event.repository";
import { AssignmentList } from "./assignment-list";

export default async function AsignacionesPage() {
  const user = await requireActiveWorker();
  const worker = await getWorkerIdForUser(user.id);

  if (!worker) {
    return <p className="text-sm text-muted-foreground">No se encontró tu perfil de trabajador.</p>;
  }

  const assignments = await listAssignmentsForWorker(worker.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mis asignaciones</h1>
        <p className="text-sm text-muted-foreground">Acepta o rechaza tus próximas asignaciones a eventos.</p>
      </div>
      <AssignmentList assignments={assignments} />
    </div>
  );
}
