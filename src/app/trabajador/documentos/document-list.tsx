/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getExpiryStatus } from "@/utils/date";
import type { DocumentType } from "@/generated/prisma/enums";

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ID_CARD: "Cédula",
  RESUME: "Currículum",
  HEALTH_CARD: "Carnet de salud",
  FOOD_HANDLING: "Manipulación de alimentos",
  LICENSE: "Licencia",
  CERTIFICATE: "Certificado",
  OTHER: "Otro",
};

const STATUS_BADGE: Record<string, { label: string; variant: "secondary" | "outline" | "destructive" }> = {
  none: { label: "Sin vencimiento", variant: "outline" },
  valid: { label: "Vigente", variant: "secondary" },
  expiring_soon: { label: "Por vencer", variant: "outline" },
  expired: { label: "Vencido", variant: "destructive" },
};

interface DocumentItem {
  id: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  expiresAt: Date | null;
}

export function DocumentList({ documents }: { documents: DocumentItem[] }) {
  if (documents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Aún no has subido documentos.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {documents.map((doc) => {
        const status = STATUS_BADGE[getExpiryStatus(doc.expiresAt)];
        return (
          <Card key={doc.id}>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {DOCUMENT_TYPE_LABELS[doc.type]}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {doc.expiresAt ? `Vence ${new Intl.DateTimeFormat("es").format(doc.expiresAt)}` : "Sin vencimiento"}
                  </p>
                </div>
              </div>
              <Badge variant={status.variant}>{status.label}</Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
