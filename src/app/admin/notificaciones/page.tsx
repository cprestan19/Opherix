/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { Mail, Smartphone, MessageCircle, MessageSquare } from "lucide-react";
import { getEffectiveCompanyId } from "@/lib/tenant";
import { listRecentNotifications } from "@/repositories/notification.repository";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CHANNEL_ICONS = { EMAIL: Mail, PUSH: Smartphone, WHATSAPP: MessageCircle, SMS: MessageSquare };

const STATUS_VARIANTS: Record<string, "secondary" | "outline" | "destructive"> = {
  SENT: "secondary",
  PENDING: "outline",
  FAILED: "destructive",
  READ: "secondary",
};

export default async function NotificacionesAdminPage() {
  const companyId = await getEffectiveCompanyId();
  const notifications = await listRecentNotifications(companyId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notificaciones</h1>
        <p className="text-sm text-muted-foreground">Historial de push y email enviados.</p>
      </div>

      {notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No se han enviado notificaciones todavía.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const Icon = CHANNEL_ICONS[n.channel];
            return (
              <Card key={n.id}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {n.title} — {n.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{n.body}</p>
                      {n.status === "FAILED" && n.errorMessage ? (
                        <p className="mt-0.5 text-xs text-danger">Motivo: {n.errorMessage}</p>
                      ) : null}
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[n.status]} className="shrink-0">
                    {n.status}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
