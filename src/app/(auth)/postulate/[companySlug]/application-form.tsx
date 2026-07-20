/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import {
  workerApplicationSchema,
  specialtyValues,
  specialtyLabels,
  APPLICATION_STEPS,
  type WorkerApplicationInput,
} from "@/lib/validations/worker-application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ChipInput } from "@/components/shared/chip-input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { submitApplicationAction } from "./actions";
import { PhotoUploadField } from "@/components/shared/photo-upload-field";
import { FileUploadField } from "@/components/shared/file-upload-field";

const WEEKDAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

const defaultValues: WorkerApplicationInput = {
  name: "",
  email: "",
  phone: "",
  idNumber: "",
  nationality: "",
  birthDate: "",
  address: "",
  maritalStatus: "",
  hasChildren: false,
  childrenCount: 0,
  photoUrl: "",
  idDocumentUrl: "",
  idDocumentName: "",
  education: "",
  courses: [],
  languages: [],
  specialties: [],
  experienceYears: 0,
  previousEmployers: [],
  references: [{ name: "", phone: "", relation: "" }],
  licenses: [],
  hasVehicle: false,
  vehicleType: "",
  uniformShirtSize: "",
  uniformPantsSize: "",
  uniformShoeSize: "",
  availableDays: [],
  allergies: "",
  conditions: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  healthCardUrl: "",
  healthCardName: "",
};

export function ApplicationForm({ companySlug }: { companySlug: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<WorkerApplicationInput>({
    resolver: zodResolver(workerApplicationSchema),
    defaultValues,
  });

  const employers = useFieldArray({ control, name: "previousEmployers" });
  const references = useFieldArray({ control, name: "references" });
  const hasChildren = watch("hasChildren");
  const hasVehicle = watch("hasVehicle");

  const isLastStep = step === APPLICATION_STEPS.length - 1;

  async function goNext() {
    const valid = await trigger(APPLICATION_STEPS[step].fields as Path<WorkerApplicationInput>[]);
    if (!valid) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, APPLICATION_STEPS.length - 1));
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(values: WorkerApplicationInput) {
    setServerError(null);
    const result = await submitApplicationAction(companySlug, values);
    if (result?.error) {
      setServerError(result.error);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        if (!isLastStep) {
          e.preventDefault();
          goNext();
          return;
        }
        handleSubmit(onSubmit)(e);
      }}
      className="flex flex-col gap-8"
    >
      {/* Progreso */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Paso {step + 1} de {APPLICATION_STEPS.length}
          </span>
          <span>{Math.round(((step + 1) / APPLICATION_STEPS.length) * 100)}%</span>
        </div>
        <Progress value={((step + 1) / APPLICATION_STEPS.length) * 100} />
      </div>

      {/* Indicador de pasos */}
      <ol className="flex items-center gap-2">
        {APPLICATION_STEPS.map((s, i) => (
          <li key={s.title} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "border-2 border-primary text-primary"
                    : "border border-border text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-sm font-medium sm:inline",
                i === step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.title}
            </span>
            {i < APPLICATION_STEPS.length - 1 ? (
              <div className={cn("h-px flex-1", i < step ? "bg-primary" : "bg-border")} />
            ) : null}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: 24 * direction }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 * direction }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {step === 0 ? (
            <FieldSet>
              <p className="mb-4 text-sm text-muted-foreground">{APPLICATION_STEPS[0].description}</p>
              <FieldGroup>
                <Field>
                  <FieldLabel>Foto</FieldLabel>
                  <Controller
                    control={control}
                    name="photoUrl"
                    render={({ field }) => (
                      <PhotoUploadField folder="/applicants" value={field.value} onChange={field.onChange} />
                    )}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.name}>
                    <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
                    <Input id="name" {...register("name")} />
                    <FieldError errors={[errors.name]} />
                  </Field>
                  <Field data-invalid={!!errors.idNumber}>
                    <FieldLabel htmlFor="idNumber">Cédula</FieldLabel>
                    <Input id="idNumber" {...register("idNumber")} />
                    <FieldError errors={[errors.idNumber]} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.nationality}>
                    <FieldLabel htmlFor="nationality">Nacionalidad</FieldLabel>
                    <Input id="nationality" placeholder="Ej. Panameña" {...register("nationality")} />
                    <FieldError errors={[errors.nationality]} />
                  </Field>
                  <Field data-invalid={!!errors.birthDate}>
                    <FieldLabel htmlFor="birthDate">Fecha de nacimiento</FieldLabel>
                    <Input id="birthDate" type="date" {...register("birthDate")} />
                    <FieldError errors={[errors.birthDate]} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.idDocumentUrl}>
                    <FieldLabel>Foto de cédula o pasaporte</FieldLabel>
                    <Controller
                      control={control}
                      name="idDocumentUrl"
                      render={({ field }) => (
                        <FileUploadField
                          folder="/applicants/documents"
                          value={
                            field.value
                              ? { url: field.value, name: watch("idDocumentName") || "documento" }
                              : undefined
                          }
                          onChange={(file) => {
                            field.onChange(file.url);
                            setValue("idDocumentName", file.name);
                          }}
                        />
                      )}
                    />
                    <FieldDescription>
                      Puedes tomarla con la cámara del celular o subirla desde tu computadora.
                    </FieldDescription>
                    <FieldError errors={[errors.idDocumentUrl]} />
                  </Field>
                  <Field data-invalid={!!errors.email}>
                    <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                    <Input id="email" type="email" {...register("email")} />
                    <FieldError errors={[errors.email]} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.phone}>
                    <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                    <Input id="phone" {...register("phone")} />
                    <FieldError errors={[errors.phone]} />
                  </Field>
                  <Field data-invalid={!!errors.address}>
                    <FieldLabel htmlFor="address">Dirección</FieldLabel>
                    <Input id="address" {...register("address")} />
                    <FieldError errors={[errors.address]} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field data-invalid={!!errors.maritalStatus}>
                    <FieldLabel htmlFor="maritalStatus">Estado civil</FieldLabel>
                    <Input id="maritalStatus" {...register("maritalStatus")} />
                    <FieldError errors={[errors.maritalStatus]} />
                  </Field>
                  <Field orientation="horizontal" className="sm:col-span-2 sm:items-end sm:pb-2">
                    <Controller
                      control={control}
                      name="hasChildren"
                      render={({ field }) => (
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} id="hasChildren" />
                      )}
                    />
                    <FieldLabel htmlFor="hasChildren" className="font-normal">
                      Tengo hijos
                    </FieldLabel>
                    {hasChildren ? (
                      <Input
                        type="number"
                        min={0}
                        className="ml-2 w-24"
                        placeholder="Cantidad"
                        {...register("childrenCount", { valueAsNumber: true })}
                      />
                    ) : null}
                  </Field>
                </div>
              </FieldGroup>
            </FieldSet>
          ) : null}

          {step === 1 ? (
            <FieldSet>
              <p className="mb-4 text-sm text-muted-foreground">{APPLICATION_STEPS[1].description}</p>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.education}>
                    <FieldLabel htmlFor="education">Escolaridad</FieldLabel>
                    <Input
                      id="education"
                      placeholder="Ej. Bachiller, Técnico, Universitario"
                      {...register("education")}
                    />
                    <FieldError errors={[errors.education]} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="courses">Cursos</FieldLabel>
                    <Controller
                      control={control}
                      name="courses"
                      render={({ field }) => (
                        <ChipInput
                          id="courses"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Escribe y presiona Enter"
                        />
                      )}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.languages}>
                    <FieldLabel htmlFor="languages">Idiomas</FieldLabel>
                    <Controller
                      control={control}
                      name="languages"
                      render={({ field }) => (
                        <ChipInput
                          id="languages"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Ej. Español, Inglés"
                        />
                      )}
                    />
                    <FieldError errors={[errors.languages]} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="licenses">Licencias</FieldLabel>
                    <Controller
                      control={control}
                      name="licenses"
                      render={({ field }) => (
                        <ChipInput
                          id="licenses"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Ej. Manipulación de alimentos"
                        />
                      )}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.specialties}>
                    <FieldLabel>Especialidades</FieldLabel>
                    <Controller
                      control={control}
                      name="specialties"
                      render={({ field }) => (
                        <div className="flex flex-wrap gap-2">
                          {specialtyValues.map((value) => {
                            const checked = field.value.includes(value);
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() =>
                                  field.onChange(
                                    checked
                                      ? field.value.filter((v) => v !== value)
                                      : [...field.value, value],
                                  )
                                }
                                className={cn(
                                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                                  checked
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-muted-foreground",
                                )}
                              >
                                {specialtyLabels[value]}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    />
                    <FieldDescription>Puedes elegir más de una.</FieldDescription>
                    <FieldError errors={[errors.specialties]} />
                  </Field>
                  <Field data-invalid={!!errors.experienceYears}>
                    <FieldLabel htmlFor="experienceYears">Años de experiencia</FieldLabel>
                    <Input
                      id="experienceYears"
                      type="number"
                      min={0}
                      {...register("experienceYears", { valueAsNumber: true })}
                    />
                    <FieldError errors={[errors.experienceYears]} />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Empresas anteriores</FieldLabel>
                  <div className="flex flex-col gap-3">
                    {employers.fields.map((item, index) => (
                      <div key={item.id} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-4">
                        <Input placeholder="Empresa" {...register(`previousEmployers.${index}.company` as const)} />
                        <Input placeholder="Puesto" {...register(`previousEmployers.${index}.role` as const)} />
                        <Input placeholder="Desde" {...register(`previousEmployers.${index}.from` as const)} />
                        <div className="flex gap-2">
                          <Input placeholder="Hasta" {...register(`previousEmployers.${index}.to` as const)} />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Quitar empresa anterior"
                            onClick={() => employers.remove(index)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      className="w-fit gap-1"
                      onClick={() => employers.append({ company: "", role: "", from: "", to: "" })}
                    >
                      <Plus className="size-4" /> Agregar empresa anterior
                    </Button>
                  </div>
                </Field>

                <Field data-invalid={!!errors.references}>
                  <FieldLabel>Referencias</FieldLabel>
                  <div className="flex flex-col gap-3">
                    {references.fields.map((item, index) => (
                      <div key={item.id} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-4">
                        <Input placeholder="Nombre" {...register(`references.${index}.name` as const)} />
                        <Input placeholder="Teléfono" {...register(`references.${index}.phone` as const)} />
                        <Input placeholder="Relación" {...register(`references.${index}.relation` as const)} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="w-fit"
                          aria-label="Quitar referencia"
                          onClick={() => references.remove(index)}
                          disabled={references.fields.length === 1}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      className="w-fit gap-1"
                      onClick={() => references.append({ name: "", phone: "", relation: "" })}
                    >
                      <Plus className="size-4" /> Agregar referencia
                    </Button>
                  </div>
                  <FieldError errors={[errors.references]} />
                </Field>
              </FieldGroup>
            </FieldSet>
          ) : null}

          {step === 2 ? (
            <FieldSet>
              <p className="mb-4 text-sm text-muted-foreground">{APPLICATION_STEPS[2].description}</p>
              <FieldGroup>
                <Field orientation="horizontal">
                  <Controller
                    control={control}
                    name="hasVehicle"
                    render={({ field }) => (
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} id="hasVehicle" />
                    )}
                  />
                  <FieldLabel htmlFor="hasVehicle" className="font-normal">
                    Cuento con vehículo o moto propia
                  </FieldLabel>
                  {hasVehicle ? (
                    <Input className="ml-2 max-w-48" placeholder="Tipo de vehículo" {...register("vehicleType")} />
                  ) : null}
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field data-invalid={!!errors.uniformShirtSize}>
                    <FieldLabel htmlFor="uniformShirtSize">Talla camisa</FieldLabel>
                    <Input id="uniformShirtSize" {...register("uniformShirtSize")} />
                    <FieldError errors={[errors.uniformShirtSize]} />
                  </Field>
                  <Field data-invalid={!!errors.uniformPantsSize}>
                    <FieldLabel htmlFor="uniformPantsSize">Talla pantalón</FieldLabel>
                    <Input id="uniformPantsSize" {...register("uniformPantsSize")} />
                    <FieldError errors={[errors.uniformPantsSize]} />
                  </Field>
                  <Field data-invalid={!!errors.uniformShoeSize}>
                    <FieldLabel htmlFor="uniformShoeSize">Talla calzado</FieldLabel>
                    <Input id="uniformShoeSize" {...register("uniformShoeSize")} />
                    <FieldError errors={[errors.uniformShoeSize]} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>Días generalmente disponibles</FieldLabel>
                  <Controller
                    control={control}
                    name="availableDays"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map((day) => {
                          const checked = field.value.includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() =>
                                field.onChange(
                                  checked
                                    ? field.value.filter((d) => d !== day.value)
                                    : [...field.value, day.value],
                                )
                              }
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                                checked
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background text-muted-foreground",
                              )}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                  <FieldDescription>Podrás ajustar tu disponibilidad detallada una vez aprobado.</FieldDescription>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="allergies">Alergias</FieldLabel>
                    <Textarea id="allergies" rows={2} {...register("allergies")} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="conditions">Condiciones médicas</FieldLabel>
                    <Textarea id="conditions" rows={2} {...register("conditions")} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>Carnet de salud (opcional)</FieldLabel>
                  <Controller
                    control={control}
                    name="healthCardUrl"
                    render={({ field }) => (
                      <FileUploadField
                        folder="/applicants/documents"
                        value={
                          field.value
                            ? { url: field.value, name: watch("healthCardName") || "documento" }
                            : undefined
                        }
                        onChange={(file) => {
                          field.onChange(file.url);
                          setValue("healthCardName", file.name);
                        }}
                      />
                    )}
                  />
                  <FieldDescription>Si aún no lo tienes, puedes subirlo más adelante desde tu perfil.</FieldDescription>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.emergencyContactName}>
                    <FieldLabel htmlFor="emergencyContactName">Nombre de contacto de emergencia</FieldLabel>
                    <Input id="emergencyContactName" {...register("emergencyContactName")} />
                    <FieldError errors={[errors.emergencyContactName]} />
                  </Field>
                  <Field data-invalid={!!errors.emergencyContactPhone}>
                    <FieldLabel htmlFor="emergencyContactPhone">Teléfono de emergencia</FieldLabel>
                    <Input id="emergencyContactPhone" {...register("emergencyContactPhone")} />
                    <FieldError errors={[errors.emergencyContactPhone]} />
                  </Field>
                </div>
                <FieldDescription>
                  La información de salud es confidencial: solo la ve el equipo administrativo, nunca los
                  clientes.
                </FieldDescription>
              </FieldGroup>
            </FieldSet>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

      <div className="flex items-center justify-between">
        {step > 0 ? (
          <Button type="button" onClick={goBack} className="gap-1">
            <ChevronLeft className="size-4" /> Atrás
          </Button>
        ) : (
          <span />
        )}
        {isLastStep ? (
          <Button type="submit" disabled={isSubmitting} size="lg" className="gap-2">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Enviar postulación
          </Button>
        ) : (
          <Button type="submit" size="lg" className="gap-1">
            Continuar <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
