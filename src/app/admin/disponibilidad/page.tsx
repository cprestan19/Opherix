/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { getEffectiveCompanyId } from "@/lib/tenant";
import { listWorkersWithAvailability, listPendingTimeOff } from "@/repositories/availability.repository";
import { AvailabilityOverview } from "./availability-overview";
import { TimeOffQueue } from "./time-off-queue";

export default async function DisponibilidadAdminPage() {
  const companyId = await getEffectiveCompanyId();
  const [workers, pendingTimeOff] = await Promise.all([
    listWorkersWithAvailability(companyId),
    listPendingTimeOff(companyId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Disponibilidad</h1>
        <p className="text-sm text-muted-foreground">Vista consolidada de disponibilidad del personal.</p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Solicitudes pendientes ({pendingTimeOff.length})
        </h2>
        <TimeOffQueue items={pendingTimeOff} />
      </div>

      <AvailabilityOverview workers={workers} />
    </div>
  );
}
