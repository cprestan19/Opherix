/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { getEffectiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { listClients, listDeletedClients } from "@/services/client.service";
import { getCompany } from "@/repositories/config.repository";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientForm } from "./client-form";
import { ShareEventRequestLink } from "./share-event-request-link";
import { ClientStatusToggle } from "./client-status-toggle";
import { ClientDeleteAction } from "./client-delete-action";

const dateFormatter = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric" });

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ eliminados?: string }>;
}) {
  const currentUser = await getCurrentUser();
  const isViewer = currentUser.role === "VIEWER";
  const companyId = await getEffectiveCompanyId();
  const { eliminados } = await searchParams;
  const showDeleted = eliminados === "1";

  if (showDeleted) {
    const deletedClients = isViewer ? [] : await listDeletedClients(companyId);
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clientes eliminados</h1>
            <p className="text-sm text-muted-foreground">{deletedClients.length} cliente(s) eliminado(s).</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/clientes">Volver a clientes</Link>
          </Button>
        </div>
        {deletedClients.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No hay clientes eliminados.
            </CardContent>
          </Card>
        ) : (
          <Card className="py-0">
            <ul className="divide-y divide-border">
              {deletedClients.map((client) => (
                <li key={client.id}>
                  <div className="flex items-center gap-3 py-2.5 pr-4 pl-3.5 sm:gap-4">
                    <Avatar className="size-10 shrink-0">
                      <AvatarFallback className="text-xs">
                        {client.businessName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{client.businessName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {client.contactName} · {client.contactEmail}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Eliminado {client.deletedAt ? dateFormatter.format(client.deletedAt) : ""}
                        {client.deletedReason ? ` · ${client.deletedReason}` : ""}
                      </p>
                    </div>
                    <ClientDeleteAction clientId={client.id} deleted />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  }

  const [clients, company] = await Promise.all([listClients(companyId), getCompany(companyId)]);

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const eventRequestUrl = `${baseUrl}/solicitar/${company.slug}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clients.length} cuenta(s) cliente registradas.</p>
        </div>
        {isViewer ? null : (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/admin/clientes?eliminados=1">
                <Trash2 className="size-3.5" /> Eliminados
              </Link>
            </Button>
            <ClientForm />
          </div>
        )}
      </div>

      <ShareEventRequestLink url={eventRequestUrl} companyName={company.name} />

      {clients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay clientes registrados.
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <ul className="divide-y divide-border">
            {clients.map((client) => (
              <li key={client.id}>
                <div className="flex items-center gap-3 py-2.5 pr-4 pl-3.5 sm:gap-4">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="text-xs">{client.businessName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{client.businessName}</p>
                      <Badge variant={client.isActive ? "secondary" : "outline"} className="shrink-0">
                        {client.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {client.contactName} · {client.contactEmail}
                      {client.contactPhone ? ` · ${client.contactPhone}` : ""}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {client._count.events} solicitud(es) · Registrado: {dateFormatter.format(client.createdAt)} ·
                      Última solicitud:{" "}
                      {client.events[0] ? dateFormatter.format(client.events[0].createdAt) : "—"}
                    </p>
                  </div>
                  {isViewer ? null : (
                    <div className="flex shrink-0 items-center gap-2">
                      <ClientStatusToggle clientId={client.id} isActive={client.isActive} />
                      <ClientDeleteAction clientId={client.id} deleted={false} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
