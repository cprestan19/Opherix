/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WEEKDAY_SHORT_LABELS } from "@/utils/date";
import { FRANJAS } from "@/lib/availability-franjas";
import { toggleSlotAction } from "./actions";

interface AvailabilityGridProps {
  initialSlots: { dayOfWeek: number; startTime: string; endTime: string }[];
}

function slotKey(day: number, start: string, end: string) {
  return `${day}-${start}-${end}`;
}

export function AvailabilityGrid({ initialSlots }: AvailabilityGridProps) {
  const [activeKeys, setActiveKeys] = useState(
    () => new Set(initialSlots.map((s) => slotKey(s.dayOfWeek, s.startTime, s.endTime))),
  );
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleToggle(day: number, franjaIndex: number) {
    const franja = FRANJAS[franjaIndex];
    const key = slotKey(day, franja.start, franja.end);
    setPendingKey(key);

    startTransition(async () => {
      await toggleSlotAction(day, franja.start, franja.end);
      setActiveKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
      setPendingKey(null);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Disponibilidad semanal</CardTitle>
        <CardDescription>Toca una franja para marcarte disponible o no disponible.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="w-24 text-left text-xs font-medium text-muted-foreground">Franja</th>
                {WEEKDAY_SHORT_LABELS.map((label) => (
                  <th key={label} className="text-xs font-medium text-muted-foreground">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FRANJAS.map((franja, franjaIndex) => (
                <tr key={franja.key}>
                  <td className="py-1 pr-2 text-sm text-muted-foreground">{franja.label}</td>
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
                            "flex h-10 w-full items-center justify-center rounded-md border text-xs font-medium transition-colors",
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
                              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : isActive ? "Sí" : "—"}
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
      </CardContent>
    </Card>
  );
}
