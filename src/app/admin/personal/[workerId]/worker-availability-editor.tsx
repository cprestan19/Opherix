/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WEEKDAY_SHORT_LABELS, getCurrentWeekRange, formatWeekLabel } from "@/utils/date";
import { FRANJAS } from "@/lib/availability-franjas";
import { toggleWorkerAvailabilityAction } from "./actions";

interface WorkerAvailabilityEditorProps {
  workerId: string;
  slots: { dayOfWeek: number; startTime: string; endTime: string }[];
}

function slotKey(day: number, start: string, end: string) {
  return `${day}-${start}-${end}`;
}

export function WorkerAvailabilityEditor({ workerId, slots }: WorkerAvailabilityEditorProps) {
  const [activeKeys, setActiveKeys] = useState(
    () => new Set(slots.map((s) => slotKey(s.dayOfWeek, s.startTime, s.endTime))),
  );
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleToggle(day: number, franjaIndex: number) {
    const franja = FRANJAS[franjaIndex];
    const key = slotKey(day, franja.start, franja.end);
    setPendingKey(key);

    startTransition(async () => {
      const result = await toggleWorkerAvailabilityAction(workerId, day, franja.start, franja.end);
      setPendingKey(null);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      setActiveKeys((prev) => {
        const next = new Set(prev);
        const willBeActive = !next.has(key);
        if (willBeActive) next.add(key);
        else next.delete(key);
        toast.success(willBeActive ? "Franja marcada como disponible" : "Franja marcada como no disponible");
        return next;
      });
    });
  }

  const { start, end } = getCurrentWeekRange();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Toca una franja para marcarlo disponible o no disponible.</p>
        <span className="text-xs font-medium text-muted-foreground">{formatWeekLabel(start, end)}</span>
      </div>
      <p className="text-xs text-muted-foreground">Horario recurrente semanal — se repite todas las semanas.</p>
      <div className="overflow-x-auto">
        <table className="w-fit min-w-[360px] max-w-xl border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-12 text-left text-xs font-medium text-muted-foreground">Franja</th>
              {WEEKDAY_SHORT_LABELS.map((label) => (
                <th key={label} className="w-9 text-xs font-medium text-muted-foreground">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FRANJAS.map((franja, franjaIndex) => (
              <tr key={franja.key}>
                <td className="py-1 pr-2 text-xs text-muted-foreground">{franja.label}</td>
                {WEEKDAY_SHORT_LABELS.map((_, day) => {
                  const key = slotKey(day, franja.start, franja.end);
                  const isActive = activeKeys.has(key);
                  const isPending = pendingKey === key;
                  return (
                    <td key={key} className="p-1 text-center">
                      <motion.button
                        type="button"
                        onClick={() => handleToggle(day, franjaIndex)}
                        disabled={isPending}
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          "relative flex size-7 items-center justify-center rounded-md border text-xs font-medium transition-colors",
                          isActive
                            ? "border-success bg-success/10 text-success"
                            : "border-border bg-background text-muted-foreground hover:bg-secondary",
                        )}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={isPending ? "pending" : isActive ? "on" : "off"}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="flex items-center justify-center"
                          >
                            {isPending ? <Loader2 className="size-3 animate-spin" /> : isActive ? "Sí" : "—"}
                          </motion.span>
                        </AnimatePresence>
                      </motion.button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
