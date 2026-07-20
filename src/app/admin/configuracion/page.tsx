/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { getEffectiveCompanyId } from "@/lib/tenant";
import { getCompany, getOrCreatePayRuleSet, listHolidays } from "@/repositories/config.repository";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandingForm } from "./branding-form";
import { PayRulesForm } from "./pay-rules-form";
import { HolidaysPanel } from "./holidays-panel";

const DEFAULT_RULES = { overtimeMultiplier: "1.5", sundayMultiplier: "1.5", holidayMultiplier: "2" };

export default async function ConfiguracionPage() {
  const companyId = await getEffectiveCompanyId();
  const company = await getCompany(companyId);
  const [payRules, holidays] = await Promise.all([
    getOrCreatePayRuleSet(companyId, company.country),
    listHolidays(companyId, company.country),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Branding, tarifas, feriados y roles/permisos.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Branding</CardTitle>
          <CardDescription>Nombre de tu empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <BrandingForm name={company.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Reglas de pago — {company.country}</CardTitle>
          <CardDescription>Multiplicadores usados al calcular pagos (§6.8).</CardDescription>
        </CardHeader>
        <CardContent>
          <PayRulesForm
            overtimeMultiplier={payRules ? payRules.overtimeMultiplier.toString() : DEFAULT_RULES.overtimeMultiplier}
            sundayMultiplier={payRules ? payRules.sundayMultiplier.toString() : DEFAULT_RULES.sundayMultiplier}
            holidayMultiplier={payRules ? payRules.holidayMultiplier.toString() : DEFAULT_RULES.holidayMultiplier}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Feriados — {company.country}</CardTitle>
          <CardDescription>Usados para calcular horas de feriado en los pagos.</CardDescription>
        </CardHeader>
        <CardContent>
          <HolidaysPanel holidays={holidays} />
        </CardContent>
      </Card>
    </div>
  );
}
