/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { listCompanies } from "@/services/platform.service";
import { CompanyForm } from "./company-form";
import { CompanyList } from "./company-list";

export default async function EmpresasPage() {
  const companies = await listCompanies();
  const rows = companies.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    country: c.country,
    isActive: c.isActive,
    createdAt: c.createdAt,
    lastAccessedAt: c.lastAccessedAt,
    planName: c.planName,
    planPriceMonthly: c.planPriceMonthly.toString(),
    billingStatus: c.billingStatus,
    _count: c._count,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground">{companies.length} empresa(s) usando Operix.</p>
        </div>
        <CompanyForm />
      </div>
      <CompanyList companies={rows} />
    </div>
  );
}
