/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { getEffectiveCompanyId } from "@/lib/tenant";
import { listPendingApplications } from "@/services/recruitment.service";
import { ApplicationReviewList } from "./application-review-list";

export default async function ReclutamientoPage() {
  const companyId = await getEffectiveCompanyId();
  const applications = await listPendingApplications(companyId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reclutamiento</h1>
        <p className="text-sm text-muted-foreground">
          {applications.length} postulación(es) pendiente(s) de revisión.
        </p>
      </div>
      <ApplicationReviewList applications={applications} />
    </div>
  );
}
