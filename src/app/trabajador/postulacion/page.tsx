/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { redirect } from "next/navigation";
import { Clock3, XCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PostulacionStatusPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const status = session.user.workerStatus;
  if (status === "APPROVED" || status === "ACTIVE") {
    redirect("/trabajador");
  }

  const isRejected = status === "REJECTED";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Estado de tu postulación</h1>
        <p className="text-sm text-muted-foreground">
          Aquí verás el avance de tu solicitud para unirte como personal de eventos.
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {isRejected ? (
              <XCircle className="size-5 text-danger" />
            ) : (
              <Clock3 className="size-5 text-warning" />
            )}
            <CardTitle className="text-base font-medium">
              {isRejected ? "Solicitud no aprobada" : "En revisión"}
            </CardTitle>
          </div>
          <CardDescription>
            {isRejected
              ? "Tu postulación no fue aprobada en esta ocasión. Si crees que fue un error, contacta al administrador."
              : "Un administrador está revisando tu perfil y documentos. Te notificaremos por correo/push en cuanto haya una decisión."}
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
