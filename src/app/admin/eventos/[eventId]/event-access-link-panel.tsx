/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState, useTransition } from "react";
import { Copy, Link2, Loader2, Lock, Mail, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  generateEventAccessLinkAction,
  resendEventAccessLinkAction,
  closeEventAccessLinkAction,
  reopenEventAccessLinkAction,
} from "./actions";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function EventAccessLinkPanel({
  eventId,
  companySlug,
  accessToken,
  accessTokenExpiresAt,
  accessClosedAt,
  eventEnded,
  baseUrl,
}: {
  eventId: string;
  companySlug: string;
  accessToken: string | null;
  accessTokenExpiresAt: Date | null;
  accessClosedAt: Date | null;
  eventEnded: boolean;
  baseUrl: string;
}) {
  const [link, setLink] = useState<string | null>(
    accessToken ? `${baseUrl}/solicitar/${companySlug}/evento/${eventId}?token=${accessToken}` : null,
  );
  const [expiresAt, setExpiresAt] = useState(accessTokenExpiresAt);
  const [closedAt, setClosedAt] = useState(accessClosedAt);
  const [isPending, startTransition] = useTransition();

  const isOpen = Boolean(accessToken) || link !== null;
  const isClosed = Boolean(closedAt) || (expiresAt !== null && expiresAt < new Date());

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateEventAccessLinkAction(eventId, companySlug);
      if (result?.error || !result.link) {
        toast.error(result?.error ?? "No se pudo generar el link.");
        return;
      }
      setLink(result.link);
      setExpiresAt(result.expiresAt ?? null);
      setClosedAt(null);
      toast.success("Link generado correctamente");
    });
  }

  function handleCopy() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado");
  }

  function handleResend() {
    startTransition(async () => {
      const result = await resendEventAccessLinkAction(eventId, companySlug);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Link reenviado al cliente por correo");
    });
  }

  function handleClose() {
    startTransition(async () => {
      const result = await closeEventAccessLinkAction(eventId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setClosedAt(new Date());
      toast.success("Link cerrado");
    });
  }

  function handleReopen() {
    startTransition(async () => {
      const result = await reopenEventAccessLinkAction(eventId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setClosedAt(null);
      toast.success("Link reabierto por 24 horas");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Link2 className="size-4" /> Link del cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          El cliente lo usa para ver/editar su solicitud y, al finalizar el evento, calificar el servicio.
        </p>

        {!isOpen ? (
          <Button size="sm" className="w-fit gap-1.5" disabled={isPending} onClick={handleGenerate}>
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />}
            Generar link
          </Button>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Input readOnly value={link ?? ""} className="text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label="Copiar link">
                <Copy className="size-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {closedAt
                ? `Cerrado manualmente el ${formatDateTime(closedAt)}.`
                : isClosed
                  ? `Expiró el ${expiresAt ? formatDateTime(expiresAt) : "—"}.`
                  : `Vigente hasta ${expiresAt ? formatDateTime(expiresAt) : "—"}.`}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isPending}
                onClick={handleResend}
              >
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
                Reenviar por correo
              </Button>
              {!isClosed && !closedAt ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-danger"
                  disabled={isPending}
                  onClick={handleClose}
                >
                  {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Lock className="size-3.5" />}
                  Cerrar ahora
                </Button>
              ) : null}
              {eventEnded ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={isPending}
                  onClick={handleReopen}
                >
                  {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCw className="size-3.5" />}
                  Reabrir por 24h
                </Button>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
