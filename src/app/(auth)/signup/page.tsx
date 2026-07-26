/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OpherixLogo } from "@/components/shared/opherix-logo";
import { signUpWithGoogleAction } from "./actions";

export const metadata: Metadata = {
  title: "Crea tu cuenta | Opherix",
};

const isGoogleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export default function SignupPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-secondary p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-2">
            <OpherixLogo size={32} />
            <span className="text-xl font-bold">Opherix</span>
          </div>
        </div>
        <Card className="border-border shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Crea tu cuenta</CardTitle>
            <CardDescription>
              Registra tu empresa en segundos y empieza a gestionar tu personal de eventos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {isGoogleConfigured ? (
              <form action={signUpWithGoogleAction}>
                <Button type="submit" variant="outline" className="w-full gap-2">
                  <GoogleIcon className="size-4" />
                  Registrarse con Google
                </Button>
              </form>
            ) : (
              <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                El registro con Google todavía no está configurado en este entorno.
              </p>
            )}
            <p className="text-center text-xs text-muted-foreground">
              Se crea automáticamente tu propia empresa — puedes ajustar nombre, país y equipo después
              desde Configuración.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-primary underline underline-offset-4">
                Inicia sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.66-.22-2.44H12v4.62h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.88c2.27-2.09 3.57-5.17 3.57-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3.01c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.26A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.55.37-2.26V6.63H1.27A11.97 11.97 0 0 0 0 12c0 1.93.46 3.76 1.27 5.37l4-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.63l4 3.11C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </svg>
  );
}
