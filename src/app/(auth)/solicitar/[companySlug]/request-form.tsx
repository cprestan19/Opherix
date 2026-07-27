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
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Plus, Trash2, Star, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TurnstileWidget } from "@/components/shared/turnstile-widget";
import { FileUploadField } from "@/components/shared/file-upload-field";
import { cn } from "@/lib/utils";
import { publicEventRequestSchema, type PublicEventRequestInput } from "@/lib/validations/public-event-request";
import { specialtyLabels, specialtyValues } from "@/lib/validations/worker-application";
import type { PublicWorkerOption } from "@/services/public-event-request.service";
import { submitPublicEventRequestAction, getReturningContactAction } from "./actions";

const defaultValues: PublicEventRequestInput = {
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  businessName: "",
  taxId: "",
  operationRegistration: undefined,
  eventTitle: "",
  eventType: "",
  address: "",
  startAt: "",
  endAt: "",
  notes: "",
  staffNeeded: [{ specialty: "WAITER", quantity: 1 }],
  preferredWorkerIds: [],
};

export function RequestForm({
  companySlug,
  availableWorkers = [],
}: {
  companySlug: string;
  availableWorkers?: PublicWorkerOption[];
}) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState<{ eventId: string; eventAccessToken: string } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PublicEventRequestInput>({ resolver: zodResolver(publicEventRequestSchema), defaultValues });

  const staffFields = useFieldArray({ control, name: "staffNeeded" });
  const selectedWorkerIds = watch("preferredWorkerIds") ?? [];

  function toggleWorker(workerId: string) {
    const current = selectedWorkerIds;
    setValue(
      "preferredWorkerIds",
      current.includes(workerId) ? current.filter((id) => id !== workerId) : [...current, workerId],
    );
  }

  async function handleEmailBlur(email: string) {
    const contact = await getReturningContactAction(companySlug, email);
    if (contact) {
      setValue("contactName", contact.contactName);
      setValue("contactPhone", contact.contactPhone);
      setValue("businessName", contact.businessName);
      setValue("taxId", contact.taxId);
    }
  }

  async function onSubmit(values: PublicEventRequestInput) {
    setServerError(null);
    const result = await submitPublicEventRequestAction(companySlug, { ...values, turnstileToken });
    if (result?.error || !result?.eventId || !result?.eventAccessToken) {
      setServerError(result?.error ?? "No se pudo enviar la solicitud. Intenta de nuevo.");
      toast.error(result?.error ?? "No se pudo enviar la solicitud.");
      return;
    }
    toast.success("Solicitud enviada correctamente");
    setSubmitted({ eventId: result.eventId, eventAccessToken: result.eventAccessToken });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <div>
          <p className="font-medium">¡Solicitud enviada!</p>
          <p className="text-sm text-muted-foreground">
            Revisaremos tu solicitud y te confirmaremos el personal asignado. Guarda este enlace — lo
            necesitarás para ver el estado, editarla mientras esté pendiente, y calificar el servicio
            cuando el evento termine.
          </p>
        </div>
        <Button
          onClick={() =>
            router.push(`/solicitar/${companySlug}/evento/${submitted.eventId}?token=${submitted.eventAccessToken}`)
          }
          className="w-full max-w-xs"
        >
          Ver mi solicitud
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!errors.contactName}>
          <FieldLabel htmlFor="contactName">Nombre completo</FieldLabel>
          <Input id="contactName" {...register("contactName")} />
          <FieldError errors={[errors.contactName]} />
        </Field>
        <Field data-invalid={!!errors.contactEmail}>
          <FieldLabel htmlFor="contactEmail">Correo electrónico</FieldLabel>
          <Input
            id="contactEmail"
            type="email"
            {...register("contactEmail", { onBlur: (e) => handleEmailBlur(e.target.value) })}
          />
          <FieldError errors={[errors.contactEmail]} />
        </Field>
      </div>

      <Field data-invalid={!!errors.contactPhone}>
        <FieldLabel htmlFor="contactPhone">Teléfono</FieldLabel>
        <Input id="contactPhone" {...register("contactPhone")} />
        <FieldError errors={[errors.contactPhone]} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!errors.businessName}>
          <FieldLabel htmlFor="businessName">Nombre de la empresa</FieldLabel>
          <Input id="businessName" {...register("businessName")} />
          <FieldError errors={[errors.businessName]} />
        </Field>
        <Field data-invalid={!!errors.taxId}>
          <FieldLabel htmlFor="taxId">RUC</FieldLabel>
          <Input id="taxId" {...register("taxId")} />
          <FieldError errors={[errors.taxId]} />
        </Field>
      </div>

      <Field>
        <FieldLabel>Registro de operación (opcional)</FieldLabel>
        <Controller
          control={control}
          name="operationRegistration"
          render={({ field }) => (
            <FileUploadField folder="/clients/documents" value={field.value} onChange={field.onChange} />
          )}
        />
      </Field>

      <Field data-invalid={!!errors.eventTitle}>
        <FieldLabel htmlFor="eventTitle">Nombre del evento</FieldLabel>
        <Input id="eventTitle" {...register("eventTitle")} />
        <FieldError errors={[errors.eventTitle]} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
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

      <div className="grid gap-4 sm:grid-cols-2">
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
                name={`staffNeeded.${index}.specialty`}
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
                {...register(`staffNeeded.${index}.quantity` as const, { valueAsNumber: true })}
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
        <FieldError errors={[errors.staffNeeded]} />
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
        <FieldLabel htmlFor="notes">Observaciones (opcional)</FieldLabel>
        <Textarea id="notes" rows={2} {...register("notes")} />
      </Field>

      <TurnstileWidget onVerify={setTurnstileToken} />

      {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="gap-2">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Enviar solicitud
      </Button>
    </form>
  );
}
