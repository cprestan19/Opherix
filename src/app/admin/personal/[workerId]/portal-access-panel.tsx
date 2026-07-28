/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, Loader2, MessageCircle, ShieldOff, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from "@/components/shared/responsive-dialog";
import { grantPortalAccessAction, revokePortalAccessAction } from "./actions";

function buildWhatsAppUrl(phone: string | null, message: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

interface PortalAccessPanelProps {
  workerId: string;
  workerName: string;
  username: string | null;
  userStatus: string;
  phone: string | null;
}

export function PortalAccessPanel({ workerId, workerName, username, userStatus, phone }: PortalAccessPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [result, setResult] = useState<{ username: string; password: string } | null>(null);

  const hasActiveAccess = Boolean(username) && userStatus === "ACTIVE";

  function handleGrant() {
    startTransition(async () => {
      const res = await grantPortalAccessAction(workerId);
      if (res.error || !res.username || !res.password) {
        toast.error(res.error ?? "No se pudo otorgar acceso.");
        return;
      }
      setResult({ username: res.username, password: res.password });
      router.refresh();
    });
  }

  function handleRevoke() {
    startTransition(async () => {
      const res = await revokePortalAccessAction(workerId);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Acceso al portal revocado");
      setRevokeOpen(false);
      router.refresh();
    });
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(`Usuario: ${result.username}\nContraseña: ${result.password}`);
    toast.success("Copiado al portapapeles");
  }

  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "https://opherix.app/login";
  const whatsAppMessage = result
    ? `Hola ${workerName}, ya tienes acceso al portal de Opherix.\n\nUsuario: ${result.username}\nContraseña: ${result.password}\n\nIngresa aquí: ${loginUrl}\n\nTe pedirá cambiar la contraseña la primera vez que entres.`
    : "";
  const whatsAppUrl = buildWhatsAppUrl(phone, whatsAppMessage);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <KeyRound className="size-4 text-primary" /> Acceso al portal
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {username ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Usuario:</span>
              <code className="rounded bg-muted px-1.5 py-0.5">{username}</code>
              <Badge variant={hasActiveAccess ? "secondary" : "outline"}>
                {hasActiveAccess ? "Acceso activo" : "Acceso revocado"}
              </Badge>
            </div>
          ) : (
            <Badge variant="outline">Sin acceso al portal</Badge>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button type="button" size="sm" className="gap-1.5" disabled={isPending} onClick={handleGrant}>
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
              {username ? "Reenviar acceso" : "Dar acceso al portal"}
            </Button>
            {hasActiveAccess ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 text-danger"
                onClick={() => setRevokeOpen(true)}
              >
                <ShieldOff className="size-3.5" /> Declinar acceso
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declinar acceso al portal</DialogTitle>
            <DialogDescription>
              {workerName} no podrá volver a iniciar sesión hasta que le otorgues acceso de nuevo. Su usuario
              ({username}) se conserva para cuando lo reactives.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" disabled={isPending} onClick={handleRevoke}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Declinar acceso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={result !== null} onOpenChange={(open) => !open && setResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acceso otorgado</DialogTitle>
            <DialogDescription>
              Comparte estas credenciales con {workerName} — no vuelven a mostrarse. Le pedirá cambiar la
              contraseña en su primer inicio de sesión.
            </DialogDescription>
          </DialogHeader>
          {result ? (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3 font-mono text-sm">
              <p>
                Usuario: <span className="font-semibold">{result.username}</span>
              </p>
              <p>
                Contraseña: <span className="font-semibold">{result.password}</span>
              </p>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" className="gap-1.5" onClick={handleCopy}>
              <Copy className="size-3.5" /> Copiar
            </Button>
            {whatsAppUrl ? (
              <Button asChild className="gap-1.5 bg-[#25D366] text-white hover:bg-[#1ea952]">
                <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-3.5" /> Enviar por WhatsApp
                </a>
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sin teléfono registrado — usa &quot;Copiar&quot; para compartirlo por otro medio.
              </p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
