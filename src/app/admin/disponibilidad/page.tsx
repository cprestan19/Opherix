/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { getEffectiveCompanyId } from "@/lib/tenant";
import { listWorkersWithAvailability } from "@/repositories/availability.repository";
import { listAssignableEvents } from "@/repositories/event.repository";
import { AvailabilityOverview } from "./availability-overview";

export default async function DisponibilidadAdminPage() {
  const companyId = await getEffectiveCompanyId();
  const [workers, events] = await Promise.all([
    listWorkersWithAvailability(companyId),
    listAssignableEvents(companyId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Disponibilidad</h1>
        <p className="text-sm text-muted-foreground">Vista consolidada de disponibilidad del personal.</p>
      </div>

      <AvailabilityOverview workers={workers} events={events} />
    </div>
  );
}
