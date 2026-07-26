/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { requireActiveWorker } from "@/lib/worker-guard";
import { getWorkerIdForUser } from "@/repositories/availability.repository";
import { listAssignmentsForCheckIn } from "@/repositories/checkin.repository";
import { CheckInPanel } from "./check-in-panel";

export default async function CheckInTrabajadorPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; code?: string }>;
}) {
  const user = await requireActiveWorker();
  const worker = await getWorkerIdForUser(user.id);
  const params = await searchParams;

  if (!worker) {
    return <p className="text-sm text-muted-foreground">No se encontró tu perfil de trabajador.</p>;
  }

  const assignments = await listAssignmentsForCheckIn(worker.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Check-in</h1>
        <p className="text-sm text-muted-foreground">Registra tu entrada y salida en el evento asignado.</p>
      </div>
      <CheckInPanel assignments={assignments} prefillEventId={params.event} prefillCode={params.code} />
    </div>
  );
}
