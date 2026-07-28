/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Option {
  id: string;
  name: string;
}

interface EventOption {
  id: string;
  title: string;
  startAt: Date;
}

export function FinancialReportFilters({
  periodStart,
  periodEnd,
  clientId,
  eventId,
  workerId,
  clients,
  events,
  workers,
}: {
  periodStart: string;
  periodEnd: string;
  clientId: string;
  eventId: string;
  workerId: string;
  clients: Option[];
  events: EventOption[];
  workers: Option[];
}) {
  const router = useRouter();
  const [start, setStart] = useState(periodStart);
  const [end, setEnd] = useState(periodEnd);
  const [selectedClientId, setSelectedClientId] = useState(clientId);
  const [selectedEventId, setSelectedEventId] = useState(eventId);
  const [selectedWorkerId, setSelectedWorkerId] = useState(workerId);

  function buildParams() {
    const params = new URLSearchParams({ view: "financiero", periodStart: start, periodEnd: end });
    if (selectedClientId) params.set("clientId", selectedClientId);
    if (selectedEventId) params.set("eventId", selectedEventId);
    if (selectedWorkerId) params.set("workerId", selectedWorkerId);
    return params;
  }

  function applyFilters() {
    router.push(`/admin/reportes?${buildParams().toString()}`);
  }

  const exportParams = buildParams().toString();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-36" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-36" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Cliente</label>
          <Select
            value={selectedClientId || "all"}
            onValueChange={(v) => {
              setSelectedClientId(v === "all" ? "" : v);
              setSelectedEventId("");
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Evento</label>
          <Select value={selectedEventId || "all"} onValueChange={(v) => setSelectedEventId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Empleado</label>
          <Select value={selectedWorkerId || "all"} onValueChange={(v) => setSelectedWorkerId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {workers.map((worker) => (
                <SelectItem key={worker.id} value={worker.id}>
                  {worker.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="gap-1.5" onClick={applyFilters}>
          <Filter className="size-4" /> Filtrar
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" asChild className="gap-1.5">
          <a href={`/api/reportes/financiero/export?${exportParams}`}>
            <FileSpreadsheet className="size-4" /> Excel
          </a>
        </Button>
        <Button variant="outline" asChild className="gap-1.5">
          <a href={`/api/reportes/financiero/export/pdf?${exportParams}`}>
            <Download className="size-4" /> PDF
          </a>
        </Button>
      </div>
    </div>
  );
}
