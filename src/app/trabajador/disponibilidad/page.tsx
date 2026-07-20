/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { requireActiveWorker } from "@/lib/worker-guard";
import { getWorkerIdForUser } from "@/repositories/availability.repository";
import * as availabilityRepo from "@/repositories/availability.repository";
import { AvailabilityGrid } from "./availability-grid";
import { TimeOffPanel } from "./time-off-panel";

export default async function DisponibilidadTrabajadorPage() {
  const user = await requireActiveWorker();
  const worker = await getWorkerIdForUser(user.id);

  if (!worker) {
    return <p className="text-sm text-muted-foreground">No se encontró tu perfil de trabajador.</p>;
  }

  const [slots, timeOffs] = await Promise.all([
    availabilityRepo.listSlotsForWorker(worker.id),
    availabilityRepo.listTimeOffForWorker(worker.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Disponibilidad</h1>
        <p className="text-sm text-muted-foreground">
          Indica tus días/horas disponibles y solicita vacaciones o permisos.
        </p>
      </div>
      <AvailabilityGrid initialSlots={slots} />
      <TimeOffPanel items={timeOffs} />
    </div>
  );
}
