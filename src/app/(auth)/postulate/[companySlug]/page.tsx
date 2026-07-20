/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findCompanyBySlug } from "@/repositories/worker.repository";
import { ApplicationForm } from "./application-form";

export const metadata: Metadata = {
  title: "Postúlate | Operix",
};

export default async function PostulateCompanyPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const company = await findCompanyBySlug(companySlug);
  if (!company) notFound();

  return (
    <div className="min-h-svh w-full bg-secondary px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Únete al equipo de {company.name}</CardTitle>
            <CardDescription>
              Completa tu postulación como personal de eventos: meseros, bartenders, anfitriones,
              cocineros, seguridad y logística.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApplicationForm companySlug={company.slug} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
