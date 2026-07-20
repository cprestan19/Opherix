/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApplicationSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-secondary p-6">
      <Card className="w-full max-w-md border-border shadow-sm text-center">
        <CardHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-6" />
          </div>
          <CardTitle className="mt-2">¡Postulación enviada!</CardTitle>
          <CardDescription>
            Un administrador revisará tu perfil. Te notificaremos en cuanto haya una decisión. Para
            ver el estado de tu postulación, crea una contraseña con tu correo desde
            &quot;¿Olvidaste tu contraseña?&quot; en la pantalla de inicio de sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="text-sm text-primary underline underline-offset-4">
            Crear mi contraseña
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
