/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCompanyBySlug } from "@/repositories/worker.repository";
import { findClientByAccessToken } from "@/repositories/client.repository";
import { Card, CardContent } from "@/components/ui/card";
import { PublicFormHeader } from "@/components/shared/public-form-header";
import { NewEventForm } from "./new-event-form";

export const metadata: Metadata = {
  title: "Nuevo evento | Opherix",
};

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ companySlug: string; token: string }>;
}) {
  const { companySlug, token } = await params;
  const company = await findCompanyBySlug(companySlug);
  if (!company) notFound();

  const client = await findClientByAccessToken(company.id, token);

  if (!client) {
    return (
      <div className="min-h-svh w-full bg-secondary px-4 py-10">
        <div className="mx-auto w-full max-w-lg">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Este enlace no es válido. Contacta a {company.name} para que te compartan uno nuevo.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh w-full bg-secondary px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Card className="border-border shadow-sm">
          <PublicFormHeader
            title={`Nuevo evento — ${company.name}`}
            description={`Solicitando como ${client.businessName}. No necesitas volver a llenar tus datos de contacto.`}
          />
          <CardContent className="pt-4">
            <NewEventForm companySlug={companySlug} token={token} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
