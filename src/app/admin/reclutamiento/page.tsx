/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { listPendingApplications } from "@/services/recruitment.service";
import { getCompany } from "@/repositories/config.repository";
import { ApplicationReviewList } from "./application-review-list";
import { SharePostulationLink } from "./share-postulation-link";

export default async function ReclutamientoPage() {
  const currentUser = await getCurrentUser();
  const companyId = await getEffectiveCompanyId();
  const [applications, company] = await Promise.all([
    listPendingApplications(companyId),
    getCompany(companyId),
  ]);

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const postulationUrl = `${baseUrl}/postulate/${company.slug}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reclutamiento</h1>
        <p className="text-sm text-muted-foreground">
          {applications.length} postulación(es) pendiente(s) de revisión.
        </p>
      </div>
      <SharePostulationLink url={postulationUrl} companyName={company.name} />
      <ApplicationReviewList applications={applications} readOnly={currentUser.role === "VIEWER"} />
    </div>
  );
}
