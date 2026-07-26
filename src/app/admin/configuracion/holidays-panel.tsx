/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addHolidayAction, removeHolidayAction } from "./actions";

interface Holiday {
  id: string;
  date: Date;
  name: string;
}

export function HolidaysPanel({ holidays }: { holidays: Holiday[] }) {
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAdd() {
    if (!date || !name) return;
    setIsSubmitting(true);
    await addHolidayAction(date, name);
    setIsSubmitting(false);
    toast.success("Feriado agregado correctamente");
    setDate("");
    setName("");
  }

  async function handleRemove(id: string, holidayName: string) {
    await removeHolidayAction(id);
    toast.success(`Feriado "${holidayName}" eliminado`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        <Input placeholder="Nombre del feriado" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
        <Button onClick={handleAdd} disabled={isSubmitting || !date || !name} className="gap-1">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Agregar
        </Button>
      </div>
      {holidays.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay feriados configurados.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {holidays.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <span>
                {new Intl.DateTimeFormat("es").format(h.date)} — {h.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Quitar feriado ${h.name}`}
                onClick={() => handleRemove(h.id, h.name)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
