/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { specialtyLabels, specialtyValues } from "@/lib/validations/worker-application";

export function WorkerFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Input
        placeholder="Buscar por nombre..."
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => updateParam("search", e.target.value)}
        className="sm:max-w-xs"
      />
      <Select
        defaultValue={searchParams.get("specialty") ?? "ALL"}
        onValueChange={(value) => updateParam("specialty", value)}
      >
        <SelectTrigger className="sm:w-52">
          <SelectValue placeholder="Especialidad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todas las especialidades</SelectItem>
          {specialtyValues.map((value) => (
            <SelectItem key={value} value={value}>
              {specialtyLabels[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get("status") ?? "ALL"}
        onValueChange={(value) => updateParam("status", value)}
      >
        <SelectTrigger className="sm:w-44">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos (activos)</SelectItem>
          <SelectItem value="ACTIVE">Activo</SelectItem>
          <SelectItem value="APPROVED">Aprobado</SelectItem>
          <SelectItem value="INACTIVE">Inactivo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
