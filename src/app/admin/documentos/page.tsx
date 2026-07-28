/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { getEffectiveCompanyId } from "@/lib/tenant";
import { listDocumentsForCompany } from "@/repositories/document.repository";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getExpiryStatus } from "@/utils/date";
import { DOCUMENT_TYPE_LABELS } from "@/lib/labels";

const STATUS_BADGE: Record<string, { label: string; variant: "secondary" | "outline" | "destructive" }> = {
  none: { label: "Sin vencimiento", variant: "outline" },
  valid: { label: "Vigente", variant: "secondary" },
  expiring_soon: { label: "Por vencer", variant: "outline" },
  expired: { label: "Vencido", variant: "destructive" },
};

export default async function DocumentosAdminPage() {
  const companyId = await getEffectiveCompanyId();
  const documents = await listDocumentsForCompany(companyId);

  const expiringOrExpired = documents.filter((d) => {
    const status = getExpiryStatus(d.expiresAt);
    return status === "expiring_soon" || status === "expired";
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documentos</h1>
        <p className="text-sm text-muted-foreground">
          {expiringOrExpired.length} documento(s) por vencer o vencidos.
        </p>
      </div>

      {documents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No hay documentos cargados todavía.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {documents.map((doc) => {
            const status = STATUS_BADGE[getExpiryStatus(doc.expiresAt)];
            return (
              <Card key={doc.id}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        <Link href={`/admin/personal/${doc.worker.id}`} className="hover:underline">
                          {doc.worker.user.name}
                        </Link>{" "}
                        —{" "}
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          {DOCUMENT_TYPE_LABELS[doc.type]}
                          <ExternalLink className="size-3.5" />
                        </a>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.expiresAt
                          ? `Vence ${new Intl.DateTimeFormat("es").format(doc.expiresAt)}`
                          : "Sin vencimiento"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
