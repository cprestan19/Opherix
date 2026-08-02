/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { getClientById, getClientAccessToken, getClientEventsHistory, ClientError } from "@/services/client.service";
import { getCompany } from "@/repositories/config.repository";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientAccessLinkPanel } from "./client-access-link-panel";
import { ClientHistoryTable } from "./client-history-table";
import { EditClientForm } from "./edit-client-form";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const currentUser = await getCurrentUser();
  const isViewer = currentUser.role === "VIEWER";
  const companyId = await getEffectiveCompanyId();

  let client;
  try {
    client = await getClientById(companyId, clientId);
  } catch (error) {
    if (error instanceof ClientError) notFound();
    throw error;
  }

  const [company, accessToken, history] = await Promise.all([
    getCompany(companyId),
    getClientAccessToken(companyId, clientId),
    getClientEventsHistory(companyId, clientId),
  ]);

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/clientes"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a clientes
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{client.businessName}</h1>
          <Badge variant={client.isActive ? "secondary" : "outline"}>{client.isActive ? "Activo" : "Inactivo"}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {client.contactName} · {client.contactEmail}
          {client.contactPhone ? ` · ${client.contactPhone}` : ""}
        </p>
      </div>

      <Tabs defaultValue="datos">
        <TabsList>
          <TabsTrigger value="datos">Datos</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="datos" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base font-medium">Datos del cliente</CardTitle>
              {isViewer ? null : (
                <EditClientForm
                  clientId={client.id}
                  client={{
                    businessName: client.businessName,
                    taxId: client.taxId ?? "",
                    contactName: client.contactName,
                    contactEmail: client.contactEmail,
                    contactPhone: client.contactPhone ?? "",
                    address: client.address ?? "",
                  }}
                />
              )}
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Razón social: </span>
                {client.businessName}
              </p>
              <p>
                <span className="text-muted-foreground">RUC: </span>
                {client.taxId || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Contacto: </span>
                {client.contactName}
              </p>
              <p>
                <span className="text-muted-foreground">Correo: </span>
                {client.contactEmail}
              </p>
              <p>
                <span className="text-muted-foreground">Teléfono: </span>
                {client.contactPhone || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Dirección: </span>
                {client.address || "—"}
              </p>
              {client.operationRegistrationUrl ? (
                <a
                  href={client.operationRegistrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <FileText className="size-3.5" /> Registro de operación
                </a>
              ) : null}
            </CardContent>
          </Card>

          <ClientAccessLinkPanel
            clientId={client.id}
            businessName={client.businessName}
            baseUrl={baseUrl}
            companySlug={company.slug}
            initialToken={accessToken}
          />
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ClientHistoryTable rows={history} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
