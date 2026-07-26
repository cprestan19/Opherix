/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useTransition } from "react";
import { Loader2, Check, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reviewRatingAction } from "./rating-moderation-actions";

interface PendingRating {
  id: string;
  ratingScore: number | null;
  ratingComment: string | null;
  worker: { user: { name: string } };
  event: { title: string };
}

export function RatingModerationPanel({ items }: { items: PendingRating[] }) {
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) return null;

  return (
    <Card className="border-warning/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <ShieldAlert className="size-4 text-warning" /> Calificaciones en revisión ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium">
                {item.worker.user.name} · {item.ratingScore}/5
              </p>
              <p className="text-xs text-muted-foreground">
                {item.event.title}
                {item.ratingComment ? ` — "${item.ratingComment}"` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-danger"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await reviewRatingAction(item.id, "REJECTED");
                    toast.success("Calificación oculta");
                  })
                }
              >
                <X className="size-4" /> Ocultar
              </Button>
              <Button
                size="sm"
                className="gap-1"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await reviewRatingAction(item.id, "APPROVED");
                    toast.success("Calificación publicada");
                  })
                }
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Publicar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
