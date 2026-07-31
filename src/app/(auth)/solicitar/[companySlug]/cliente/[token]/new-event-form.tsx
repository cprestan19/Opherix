/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  Pencil,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { cn } from "@/lib/utils";
import { eventRequestSchema, type EventRequestInput } from "@/lib/validations/event";
import { specialtyLabels, specialtyValues } from "@/lib/validations/worker-application";
import type { PublicWorkerOption } from "@/services/public-event-request.service";
import { estimateClientCharge, type ClientSpecialtyRateLite } from "@/lib/pricing/estimate-client-charge";
import { MAX_EVENTS_PER_BATCH } from "@/lib/event-batch";
import { createEventsForClientAction, type CreateEventsForClientItemResult } from "./actions";

interface DraftEvent extends EventRequestInput {
  _id: string;
}

type Step =
  | { name: "form"; editingId: string | null; returnTo: "list" | "review" }
  | { name: "list" }
  | { name: "review" }
  | { name: "success" };

const emptyDraft: EventRequestInput = {
  title: "",
  eventType: "",
  address: "",
  startAt: "",
  endAt: "",
  notes: "",
  staffRequirements: [{ specialty: "WAITER", quantity: 1 }],
  preferredWorkerIds: [],
};

function currency(value: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(value);
}

function formatRange(startAt: string, endAt: string) {
  if (!startAt || !endAt) return "Fecha por definir";
  const formatter = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Fecha por definir";
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

/** Aviso no bloqueante: dos eventos del mismo lote con horarios que se cruzan (posible duplicado por error). */
function findOverlapWarning(drafts: DraftEvent[]): string | null {
  for (let i = 0; i < drafts.length; i++) {
    for (let j = i + 1; j < drafts.length; j++) {
      const a = drafts[i];
      const b = drafts[j];
      if (!a.startAt || !a.endAt || !b.startAt || !b.endAt) continue;
      const aStart = new Date(a.startAt).getTime();
      const aEnd = new Date(a.endAt).getTime();
      const bStart = new Date(b.startAt).getTime();
      const bEnd = new Date(b.endAt).getTime();
      if (Number.isNaN(aStart) || Number.isNaN(aEnd) || Number.isNaN(bStart) || Number.isNaN(bEnd)) continue;
      if (aStart < bEnd && bStart < aEnd) {
        return `"${a.title || `Evento ${i + 1}`}" y "${b.title || `Evento ${j + 1}`}" tienen horarios que se cruzan — revisa si es intencional.`;
      }
    }
  }
  return null;
}

function storageKeyFor(companySlug: string, token: string) {
  return `opherix:event-batch:${companySlug}:${token}`;
}

export function NewEventForm({
  companySlug,
  token,
  availableWorkers = [],
  clientRates = [],
}: {
  companySlug: string;
  token: string;
  availableWorkers?: PublicWorkerOption[];
  clientRates?: ClientSpecialtyRateLite[];
}) {
  const storageKey = storageKeyFor(companySlug, token);
  const [drafts, setDrafts] = useState<DraftEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<Step>({ name: "form", editingId: null, returnTo: "list" });
  const [createdItems, setCreatedItems] = useState<CreateEventsForClientItemResult[]>([]);
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restaura borradores del navegador (nunca se guardan en BD hasta enviar) —
  // corre solo en cliente para no generar un mismatch de hidratación entre el
  // render del servidor (siempre vacío) y lo que haya en sessionStorage.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      const restored: DraftEvent[] = raw ? JSON.parse(raw) : [];
      if (Array.isArray(restored) && restored.length > 0) {
        setDrafts(restored);
        setStep({ name: "list" });
      }
    } catch {
      // sessionStorage corrupto o inaccesible (modo privado estricto) — se ignora, empieza en blanco.
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (drafts.length === 0) {
      window.sessionStorage.removeItem(storageKey);
    } else {
      window.sessionStorage.setItem(storageKey, JSON.stringify(drafts));
    }
  }, [drafts, hydrated, storageKey]);

  const effectiveStep: Step =
    drafts.length === 0 && (step.name === "list" || step.name === "review")
      ? { name: "form", editingId: null, returnTo: "list" }
      : step;

  const overlapWarning = useMemo(() => findOverlapWarning(drafts), [drafts]);

  const estimates = useMemo(
    () => drafts.map((draft) => estimateClientCharge(clientRates, draft.staffRequirements)),
    [drafts, clientRates],
  );
  const grandTotal = estimates.reduce((sum, e) => sum + e.total, 0);
  const anyMissingRate = estimates.some((e) => e.missingSpecialties.length > 0);

  function upsertDraft(values: EventRequestInput) {
    if (effectiveStep.name !== "form") return;
    const editingId = effectiveStep.editingId;
    const returnTo = effectiveStep.returnTo;
    setDrafts((prev) => {
      if (editingId) {
        return prev.map((d) => (d._id === editingId ? { ...values, _id: editingId } : d));
      }
      return [...prev, { ...values, _id: crypto.randomUUID() }];
    });
    setStep(returnTo === "list" ? { name: "list" } : { name: "review" });
  }

  function removeDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d._id !== id));
    toast.success("Evento quitado del lote");
  }

  function editDraft(id: string, from: "list" | "review") {
    setStep({ name: "form", editingId: id, returnTo: from });
  }

  async function handleConfirmSubmit() {
    setIsSubmitting(true);
    const payload: EventRequestInput[] = drafts.map((draft) => ({
      title: draft.title,
      eventType: draft.eventType,
      address: draft.address,
      startAt: draft.startAt,
      endAt: draft.endAt,
      notes: draft.notes,
      staffRequirements: draft.staffRequirements,
      preferredWorkerIds: draft.preferredWorkerIds,
    }));
    const result = await createEventsForClientAction(companySlug, token, payload);
    setIsSubmitting(false);
    setConfirmOpen(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    const items = result.items ?? [];
    const succeeded = items.filter((i) => i.success);
    const failedDrafts: DraftEvent[] = [];
    const nextErrors: Record<string, string> = {};

    items.forEach((item, index) => {
      if (item.success) return;
      const draft = drafts[index];
      if (draft) {
        failedDrafts.push(draft);
        nextErrors[draft._id] = item.error ?? "No se pudo crear este evento.";
      }
    });

    setCreatedItems((prev) => [...prev, ...succeeded]);
    setItemErrors(nextErrors);
    setDrafts(failedDrafts);

    if (failedDrafts.length === 0) {
      setStep({ name: "success" });
      toast.success(items.length > 1 ? "Todos los eventos se crearon correctamente" : "Evento creado correctamente");
    } else {
      toast.error(
        `${succeeded.length} de ${items.length} evento(s) se crearon. Revisa los que fallaron antes de reintentar.`,
      );
      setStep({ name: "review" });
    }
  }

  function startNewBatch() {
    setCreatedItems([]);
    setItemErrors({});
    setDrafts([]);
    setStep({ name: "form", editingId: null, returnTo: "list" });
  }

  if (effectiveStep.name === "success") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <CheckCircle2 className="size-10 text-success" />
          <p className="text-lg font-semibold">
            {createdItems.length === 1 ? "Tu evento fue enviado" : `Tus ${createdItems.length} eventos fueron enviados`}
          </p>
          <p className="text-sm text-muted-foreground">
            Quedaron registrados como pendientes de revisión. Te avisaremos cuando se confirmen.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {createdItems.map((item, index) => (
            <Card key={item.eventId ?? index}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <p className="font-medium">{item.title}</p>
                {item.eventId && item.eventAccessToken ? (
                  <Link
                    href={`/solicitar/${companySlug}/evento/${item.eventId}?token=${item.eventAccessToken}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Ver detalle
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
        <Button type="button" variant="outline" className="w-fit" onClick={startNewBatch}>
          Crear otro grupo de eventos
        </Button>
      </div>
    );
  }

  if (effectiveStep.name === "form") {
    const editingDraft = effectiveStep.editingId ? drafts.find((d) => d._id === effectiveStep.editingId) : undefined;
    const canCancel = effectiveStep.editingId !== null || drafts.length > 0;
    return (
      <EventDraftForm
        key={effectiveStep.editingId ?? "new"}
        defaultValues={editingDraft ?? emptyDraft}
        availableWorkers={availableWorkers}
        submitLabel={effectiveStep.editingId ? "Guardar cambios" : drafts.length === 0 ? "Agregar evento" : "Agregar a la lista"}
        onSave={upsertDraft}
        onCancel={
          canCancel
            ? () => setStep(effectiveStep.returnTo === "list" ? { name: "list" } : { name: "review" })
            : null
        }
      />
    );
  }

  if (effectiveStep.name === "list") {
    const atCap = drafts.length >= MAX_EVENTS_PER_BATCH;
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Tienes {drafts.length} evento{drafts.length === 1 ? "" : "s"} en este envío. Agrega más o continúa a la
          revisión final.
        </p>

        {overlapWarning ? (
          <p className="flex items-start gap-1.5 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {overlapWarning}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          {drafts.map((draft, index) => (
            <Card key={draft._id}>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{draft.title || `Evento ${index + 1}`}</p>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Editar evento"
                      onClick={() => editDraft(draft._id, "list")}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Quitar evento"
                      className="text-danger"
                      onClick={() => removeDraft(draft._id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{formatRange(draft.startAt, draft.endAt)}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {draft.staffRequirements.map((req, i) => (
                    <Badge key={i} variant="outline">
                      {specialtyLabels[req.specialty]} x{req.quantity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            disabled={atCap}
            onClick={() => setStep({ name: "form", editingId: null, returnTo: "list" })}
          >
            <Plus className="size-4" /> Agregar otro evento
          </Button>
          <Button type="button" className="gap-1.5" onClick={() => setStep({ name: "review" })}>
            Continuar a revisión
          </Button>
        </div>
        {atCap ? (
          <p className="text-xs text-muted-foreground">
            Llegaste al máximo de {MAX_EVENTS_PER_BATCH} eventos por envío. Envía este lote antes de agregar más.
          </p>
        ) : null}
      </div>
    );
  }

  // effectiveStep.name === "review"
  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit gap-1.5 text-muted-foreground"
        onClick={() => setStep({ name: "list" })}
      >
        <ArrowLeft className="size-3.5" /> Volver a la lista
      </Button>

      {overlapWarning ? (
        <p className="flex items-start gap-1.5 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {overlapWarning}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {drafts.map((draft, index) => {
          const estimate = estimates[index];
          const error = itemErrors[draft._id];
          return (
            <Card key={draft._id} className={cn(error ? "border-danger" : undefined)}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-base font-medium">{draft.title || `Evento ${index + 1}`}</CardTitle>
                  <p className="text-sm text-muted-foreground">{draft.address}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => editDraft(draft._id, "review")}
                >
                  <Pencil className="size-3.5" /> Editar
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {error ? (
                  <p className="flex items-start gap-1.5 rounded-lg border border-danger/40 bg-danger/10 p-2.5 text-xs text-danger">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    No se pudo crear en el último intento: {error} Corrígelo y vuelve a enviar.
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground">{formatRange(draft.startAt, draft.endAt)}</p>
                {draft.notes ? <p className="text-sm text-muted-foreground">{draft.notes}</p> : null}

                <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                  {estimate.breakdown.map((row, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">
                        {specialtyLabels[row.specialty]} × {row.quantity}
                        {row.chargeToClient !== null ? ` (${currency(row.chargeToClient)} c/u)` : ""}
                      </span>
                      <span className="font-medium">
                        {row.chargeToClient !== null ? currency(row.subtotal) : "A confirmar"}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-sm font-medium">Total del evento</span>
                  <span className="text-base font-semibold">{currency(estimate.total)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {anyMissingRate ? (
        <p className="flex items-start gap-1.5 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          Algunas líneas marcadas &quot;a confirmar&quot; no tienen tarifa configurada todavía — no suman al total, el equipo te
          confirmará ese precio.
        </p>
      ) : null}

      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <Calculator className="size-4 text-primary" />
            <span className="font-medium">Gran total estimado</span>
          </div>
          <span className="text-xl font-semibold">{currency(grandTotal)}</span>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Total estimado con base en el personal solicitado — puede variar según el personal que finalmente se asigne a
        cada evento.
      </p>

      <ResponsiveDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Button type="button" className="w-fit" onClick={() => setConfirmOpen(true)}>
          Enviar solicitud
        </Button>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>¿Estás seguro?</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Vas a enviar {drafts.length} evento{drafts.length === 1 ? "" : "s"} por un total estimado de{" "}
              {currency(grandTotal)}. Confirma que la información de cada evento es correcta.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isSubmitting}>
              Volver a revisar
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Enviando…" : "Confirmar y enviar"}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}

function EventDraftForm({
  defaultValues,
  availableWorkers,
  submitLabel,
  onSave,
  onCancel,
}: {
  defaultValues: EventRequestInput;
  availableWorkers: PublicWorkerOption[];
  submitLabel: string;
  onSave: (values: EventRequestInput) => void;
  onCancel: (() => void) | null;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventRequestInput>({ resolver: zodResolver(eventRequestSchema), defaultValues });

  const staffFields = useFieldArray({ control, name: "staffRequirements" });
  const selectedWorkerIds = watch("preferredWorkerIds") ?? [];

  function toggleWorker(workerId: string) {
    const current = selectedWorkerIds;
    setValue(
      "preferredWorkerIds",
      current.includes(workerId) ? current.filter((id) => id !== workerId) : [...current, workerId],
    );
  }

  return (
    <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4">
      <Field data-invalid={!!errors.title}>
        <FieldLabel htmlFor="title">Nombre del evento</FieldLabel>
        <Input id="title" {...register("title")} />
        <FieldError errors={[errors.title]} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="eventType">Tipo de evento</FieldLabel>
          <Input id="eventType" placeholder="Boda, corporativo..." {...register("eventType")} />
        </Field>
        <Field data-invalid={!!errors.address}>
          <FieldLabel htmlFor="address">Ubicación</FieldLabel>
          <Input id="address" {...register("address")} />
          <FieldError errors={[errors.address]} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field data-invalid={!!errors.startAt}>
          <FieldLabel htmlFor="startAt">Inicio</FieldLabel>
          <Input id="startAt" type="datetime-local" {...register("startAt")} />
          <FieldError errors={[errors.startAt]} />
        </Field>
        <Field data-invalid={!!errors.endAt}>
          <FieldLabel htmlFor="endAt">Fin</FieldLabel>
          <Input id="endAt" type="datetime-local" {...register("endAt")} />
          <FieldError errors={[errors.endAt]} />
        </Field>
      </div>

      <Field>
        <FieldLabel>Personal requerido</FieldLabel>
        <div className="flex flex-col gap-2">
          {staffFields.fields.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <Controller
                control={control}
                name={`staffRequirements.${index}.specialty`}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {specialtyValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {specialtyLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Input
                type="number"
                min={1}
                className="w-20"
                {...register(`staffRequirements.${index}.quantity` as const, { valueAsNumber: true })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Quitar tipo de personal"
                onClick={() => staffFields.remove(index)}
                disabled={staffFields.fields.length === 1}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit gap-1"
            onClick={() => staffFields.append({ specialty: "WAITER", quantity: 1 })}
          >
            <Plus className="size-4" /> Agregar tipo de personal
          </Button>
        </div>
        <FieldError errors={[errors.staffRequirements]} />
      </Field>

      {availableWorkers.length > 0 ? (
        <Field>
          <FieldLabel>Elige quién te atiende (opcional)</FieldLabel>
          <p className="text-xs text-muted-foreground">
            Puedes elegir a tu personal preferido — es solo una preferencia, la empresa confirma la
            asignación final.
          </p>
          <div className="flex flex-col gap-3 pt-1 pl-6">
            {availableWorkers.map((worker) => {
              const isSelected = selectedWorkerIds.includes(worker.id);
              return (
                <button
                  type="button"
                  key={worker.id}
                  onClick={() => toggleWorker(worker.id)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl border py-2.5 pr-4 pl-12 text-left transition-colors",
                    isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                  )}
                >
                  <div className="absolute top-1/2 -left-6 -translate-y-1/2">
                    <Avatar className="size-16 shadow-md ring-4 ring-background">
                      <AvatarImage src={worker.photoUrl ?? undefined} alt={worker.name} className="object-cover" />
                      <AvatarFallback className="text-base">{worker.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {isSelected ? (
                      <CheckCircle2 className="absolute -right-1 -bottom-1 size-5 rounded-full bg-background text-success" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{worker.name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="size-3 fill-warning text-warning" />
                        {Number(worker.ratingAverage).toFixed(1)}
                      </span>
                      {worker.hasHealthCard ? (
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="size-3 text-success" /> Carnet de salud
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {isSelected ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-success">
                      <CheckCircle2 className="size-3.5" /> Asignado
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </Field>
      ) : null}

      <Field>
        <FieldLabel htmlFor="notes">Observaciones</FieldLabel>
        <Textarea id="notes" rows={2} {...register("notes")} />
      </Field>

      <div className="flex gap-2">
        <Button type="submit" className="w-fit">
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
