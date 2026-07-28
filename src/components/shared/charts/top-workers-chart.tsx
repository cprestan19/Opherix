/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import Link from "next/link";
import { Star, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TopWorkersChartProps {
  data: { id: string; name: string; photoUrl: string | null; assignments: number; rating: number }[];
}

// Oro/plata/bronce solo para el podio (1º-3º) — el resto usa el neutro de
// marca. El gráfico de barras horizontal anterior usaba un eje Y de ancho
// fijo para los nombres, que se cortaba/superponía con nombres largos; esta
// lista lo evita del todo — cada nombre tiene su propia fila con ancho
// flexible en vez de compartir un eje angosto.
const RANK_STYLES = [
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  "bg-slate-200 text-slate-600 dark:bg-slate-400/20 dark:text-slate-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
];

export function TopWorkersChart({ data }: TopWorkersChartProps) {
  const max = Math.max(...data.map((w) => w.assignments), 1);

  return (
    <div className="flex flex-col gap-1">
      {data.map((worker, i) => (
        <Link
          key={worker.id}
          href={`/admin/personal/${worker.id}`}
          className="group flex items-center gap-3 rounded-lg px-1.5 py-2 transition-colors hover:bg-muted/60"
        >
          <div
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              i < 3 ? RANK_STYLES[i] : "bg-muted text-muted-foreground",
            )}
          >
            {i === 0 ? <Trophy className="size-3.5" /> : i + 1}
          </div>

          <Avatar className="size-9 shrink-0">
            <AvatarImage src={worker.photoUrl ?? undefined} alt={worker.name} className="object-cover" />
            <AvatarFallback className="text-xs">{worker.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="break-words text-sm leading-tight font-medium group-hover:text-primary">{worker.name}</p>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{worker.assignments}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(worker.assignments / max) * 100}%` }}
                />
              </div>
              <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
                <Star className="size-3 fill-warning text-warning" />
                {worker.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
