/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { redirect } from "next/navigation";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { getCompany, getOrCreatePayRuleSet, listHolidays } from "@/repositories/config.repository";
import { listClients } from "@/repositories/client.repository";
import { listRatesForCompany } from "@/repositories/client-specialty-rate.repository";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandingForm } from "./branding-form";
import { PayRulesForm } from "./pay-rules-form";
import { HolidaysPanel } from "./holidays-panel";
import { AutoArchiveForm } from "./auto-archive-form";
import { ClientRatesForm } from "./client-rates-form";

const DEFAULT_RULES = { overtimeMultiplier: "1.5", sundayMultiplier: "1.5", holidayMultiplier: "2" };

export default async function ConfiguracionPage() {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "ADMIN") redirect("/admin");

  const companyId = await getEffectiveCompanyId();
  const company = await getCompany(companyId);
  const [payRules, holidays, clients, specialtyRates] = await Promise.all([
    getOrCreatePayRuleSet(companyId, company.country),
    listHolidays(companyId, company.country),
    listClients(companyId),
    listRatesForCompany(companyId),
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
          <CardTitle className="text-base font-medium">Tarifas por cliente</CardTitle>
          <CardDescription>
            Para cada cliente registrado, cuánto se le paga al personal de cada especialidad y cuánto se le cobra
            al cliente por ese mismo personal — usado para calcular el total de cada evento y los pagos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientRatesForm
            clients={clients.map((c) => ({ id: c.id, businessName: c.businessName }))}
            records={specialtyRates.map((r) => ({
              clientId: r.clientId,
              specialty: r.specialty,
              payToWorker: r.payToWorker.toString(),
              chargeToClient: r.chargeToClient.toString(),
            }))}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Eventos</CardTitle>
          <CardDescription>Archivado automático de eventos finalizados.</CardDescription>
        </CardHeader>
        <CardContent>
          <AutoArchiveForm autoArchiveDelay={company.autoArchiveDelay} />
        </CardContent>
      </Card>
    </div>
  );
}
