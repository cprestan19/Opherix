/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface ChipInputProps {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

/**
 * Input tipo "chips": escribe y presiona Enter o coma para agregar, X o
 * Backspace (con el campo vacío) para quitar el último. Reemplaza los
 * inputs de texto separados por coma (cursos/idiomas/licencias) por algo
 * más cómodo de usar en celular.
 */
export function ChipInput({ id, value, onChange, placeholder }: ChipInputProps) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const trimmed = draft.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setDraft("");
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring/50">
      {value.map((chip, index) => (
        <Badge key={chip} variant="secondary" className="gap-1 pr-1">
          {chip}
          <button
            type="button"
            aria-label={`Quitar ${chip}`}
            onClick={() => removeAt(index)}
            className="rounded-full p-0.5 hover:bg-foreground/10"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <Input
        id={id}
        value={draft}
        onChange={(e) => {
          if (e.target.value.endsWith(",")) {
            setDraft(e.target.value.slice(0, -1));
            commitDraft();
            return;
          }
          setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitDraft();
          } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
            removeAt(value.length - 1);
          }
        }}
        onBlur={commitDraft}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="h-7 flex-1 border-none px-1 shadow-none focus-visible:ring-0"
      />
    </div>
  );
}
