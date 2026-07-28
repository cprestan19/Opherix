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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { eventRequestSchema, type EventRequestInput } from "@/lib/validations/event";
import { specialtyLabels, specialtyValues } from "@/lib/validations/worker-application";
import { createEventForClientAction } from "./actions";

const defaultValues: EventRequestInput = {
  title: "",
  eventType: "",
  address: "",
  startAt: "",
  endAt: "",
  notes: "",
  staffRequirements: [{ specialty: "WAITER", quantity: 1 }],
};

export function NewEventForm({ companySlug, token }: { companySlug: string; token: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EventRequestInput>({ resolver: zodResolver(eventRequestSchema), defaultValues });

  const staffFields = useFieldArray({ control, name: "staffRequirements" });

  async function onSubmit(values: EventRequestInput) {
    setServerError(null);
    const result = await createEventForClientAction(companySlug, token, values);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Solicitud enviada correctamente");
    router.push(`/solicitar/${companySlug}/evento/${result.eventId}?token=${result.eventAccessToken}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

      <Field>
        <FieldLabel htmlFor="notes">Observaciones</FieldLabel>
        <Textarea id="notes" rows={2} {...register("notes")} />
      </Field>

      {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-fit gap-2">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Enviar solicitud
      </Button>
    </form>
  );
}
