/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { Check, Copy, Loader2, MessageCircle, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogTrigger as DialogTrigger,
} from "@/components/shared/responsive-dialog";
import { regenerateClientAccessLinkAction } from "../actions";

export function ClientAccessLinkPanel({
  clientId,
  businessName,
  baseUrl,
  companySlug,
  initialToken,
}: {
  clientId: string;
  businessName: string;
  baseUrl: string;
  companySlug: string;
  initialToken: string;
}) {
  const [token, setToken] = useState(initialToken);
  const [copied, setCopied] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const url = `${baseUrl}/solicitar/${companySlug}/cliente/${token}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Enlace copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    const message = `¡Hola ${businessName}! Aquí tienes tu enlace para solicitar nuevos eventos sin volver a llenar tus datos: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  async function handleRegenerate() {
    setIsPending(true);
    const result = await regenerateClientAccessLinkAction(clientId);
    setIsPending(false);
    if (result?.error || !result.token) {
      toast.error(result?.error ?? "No se pudo regenerar el enlace.");
      return;
    }
    setToken(result.token);
    setConfirmOpen(false);
    toast.success("Enlace regenerado — el anterior ya no funciona");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Enlace del cliente</CardTitle>
        <CardDescription>
          Único y permanente — el cliente lo usa para solicitar eventos nuevos sin volver a llenar sus datos de
          contacto.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={url} className="font-mono text-xs sm:text-sm" onFocus={(e) => e.target.select()} />
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              Copiar
            </Button>
            <Button type="button" size="sm" className="gap-1.5" onClick={handleWhatsApp}>
              <MessageCircle className="size-4" /> WhatsApp
            </Button>
          </div>
        </div>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="w-fit gap-1.5 text-muted-foreground">
              <RotateCw className="size-3.5" /> Regenerar enlace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Regenerar enlace del cliente</DialogTitle>
              <DialogDescription>
                El enlace anterior deja de funcionar de inmediato. Úsalo solo si se compartió por error.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Volver
              </Button>
              <Button variant="destructive" disabled={isPending} onClick={handleRegenerate}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Regenerar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
