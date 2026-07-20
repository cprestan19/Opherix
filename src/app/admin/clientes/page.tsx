/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { getEffectiveCompanyId } from "@/lib/tenant";
import { listClients } from "@/services/client.service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientForm } from "./client-form";

export default async function ClientesPage() {
  const companyId = await getEffectiveCompanyId();
  const clients = await listClients(companyId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clients.length} cuenta(s) cliente registradas.</p>
        </div>
        <ClientForm />
      </div>

      {clients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay clientes registrados.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardContent className="flex flex-col gap-2 p-5">
                <p className="font-medium">{client.businessName}</p>
                <p className="text-sm text-muted-foreground">
                  {client.contactName} · {client.contactEmail}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={client.isActive ? "secondary" : "outline"}>
                    {client.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{client._count.events} evento(s)</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
