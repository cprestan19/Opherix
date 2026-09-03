/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState, useTransition } from "react";
import { Copy, FileText, Link2, Loader2, Lock, Mail, MessageCircle, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  generateEventAccessLinkAction,
  resendEventAccessLinkAction,
  closeEventAccessLinkAction,
  reopenEventAccessLinkAction,
  getEventQuoteWhatsAppLinkAction,
} from "./actions";
import { formatDateTime12h } from "@/utils/date";

function formatDateTime(date: Date) {
  return formatDateTime12h(date, { dateStyle: "medium" });
}

/** Mismo patrón que event-actions.tsx: el <span> es el trigger real, no el
 * botón, para que el tooltip funcione incluso si el botón queda disabled. */
function HintButton({ hint, children }: { hint: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}

export function EventAccessLinkPanel({
  eventId,
  companySlug,
  accessToken,
  accessTokenExpiresAt,
  accessClosedAt,
  eventEnded,
  baseUrl,
  batchId,
  batchEventCount,
}: {
  eventId: string;
  companySlug: string;
  accessToken: string | null;
  accessTokenExpiresAt: Date | null;
  accessClosedAt: Date | null;
  eventEnded: boolean;
  baseUrl: string;
  // Cuando el evento nació de un lote (§ Event.batchId), "Ver cotización"
  // abre la cotización consolidada de los batchEventCount eventos del lote
  // en vez de la de este evento solo.
  batchId?: string | null;
  batchEventCount?: number;
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

  function handleResendQuote() {
    startTransition(async () => {
      const result = await getEventQuoteWhatsAppLinkAction(eventId);
      if (result?.error || !result.url) {
        toast.error(result?.error ?? "No se pudo generar el enlace.");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
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
          <HintButton hint="Genera el link único que el cliente usa para ver/editar su solicitud y calificar el servicio.">
            <Button size="sm" className="w-fit gap-1.5" disabled={isPending} onClick={handleGenerate}>
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />}
              Generar link
            </Button>
          </HintButton>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Input readOnly value={link ?? ""} className="text-xs" />
              <HintButton hint="Copiar el link al portapapeles.">
                <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label="Copiar link">
                  <Copy className="size-4" />
                </Button>
              </HintButton>
            </div>

            <p className="text-xs text-muted-foreground">
              {closedAt
                ? `Cerrado manualmente el ${formatDateTime(closedAt)}.`
                : isClosed
                  ? `Expiró el ${expiresAt ? formatDateTime(expiresAt) : "—"}.`
                  : `Vigente hasta ${expiresAt ? formatDateTime(expiresAt) : "—"}.`}
            </p>

            <div className="flex flex-wrap gap-2">
              <HintButton hint="Reenvía el link de acceso al cliente por correo.">
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
              </HintButton>
              <HintButton
                hint={
                  batchId
                    ? `Abre el PDF de la cotización consolidada de los ${batchEventCount} eventos de este lote.`
                    : "Abre el PDF de la cotización en una pestaña nueva."
                }
              >
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a
                    href={batchId ? `/api/eventos/lote/${batchId}/cotizacion` : `/api/eventos/${eventId}/cotizacion`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="size-3.5" /> {batchId ? "Ver cotización del lote" : "Ver cotización"}
                  </a>
                </Button>
              </HintButton>
              <HintButton hint="Abre WhatsApp con la cotización lista para enviar al contacto que elijas.">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={isPending}
                  onClick={handleResendQuote}
                >
                  {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <MessageCircle className="size-3.5" />}
                  Reenviar cotización
                </Button>
              </HintButton>
              {!isClosed && !closedAt ? (
                <HintButton hint="Cierra el link de acceso del cliente antes de tiempo — deja de poder verlo/editarlo.">
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
                </HintButton>
              ) : null}
              {eventEnded ? (
                <HintButton hint="Reabre el link de acceso del cliente por 24 horas más (ej. para que pueda calificar el servicio).">
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
                </HintButton>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
