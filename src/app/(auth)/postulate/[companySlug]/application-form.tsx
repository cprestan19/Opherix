/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
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
  maritalStatusValues,
  maritalStatusLabels,
  languageValues,
  languageLabels,
  APPLICATION_STEPS,
  type WorkerApplicationInput,
} from "@/lib/validations/worker-application";
import { nationalityValues } from "@/lib/nationality-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChipInput } from "@/components/shared/chip-input";
import { DatePickerField } from "@/components/shared/date-picker-field";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { cn, toSentenceCase } from "@/lib/utils";
import { submitApplicationAction } from "./actions";
import { PhotoCaptureField } from "@/components/shared/photo-capture-field";
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
  // Placeholder de "sin seleccionar" — Zod los rechaza igual al validar (no
  // pertenecen al enum), así que el campo sigue siendo obligatorio de verdad.
  nationality: "" as WorkerApplicationInput["nationality"],
  birthDate: "",
  address: "",
  maritalStatus: "" as WorkerApplicationInput["maritalStatus"],
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

  // Si la validación falla al enviar (último paso), react-hook-form no llama
  // a onSubmit y no avisa nada visible — antes esto se sentía como "no pasó
  // nada". Se busca el primer paso que tenga un campo con error, se navega
  // ahí (donde ya se ve el recuadro rojo vía aria-invalid) y se muestra un
  // mensaje explícito en vez de fallar en silencio.
  function onInvalid(fieldErrors: typeof errors) {
    const erroredFields = Object.keys(fieldErrors);
    const stepIndex = APPLICATION_STEPS.findIndex((s) =>
      s.fields.some((f) => erroredFields.includes(f)),
    );
    if (stepIndex !== -1 && stepIndex !== step) {
      setDirection(stepIndex > step ? 1 : -1);
      setStep(stepIndex);
    }
    setServerError("Revisa los campos marcados en rojo antes de enviar tu postulación.");
  }

  return (
    <form
      onSubmit={(e) => {
        if (!isLastStep) {
          e.preventDefault();
          goNext();
          return;
        }
        handleSubmit(onSubmit, onInvalid)(e);
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
                      <PhotoCaptureField folder="/applicants" value={field.value} onChange={field.onChange} />
                    )}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.name}>
                    <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
                    <Input
                      id="name"
                      aria-invalid={!!errors.name}
                      {...register("name")}
                      onChange={(e) =>
                        setValue("name", toSentenceCase(e.target.value), {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />
                    <FieldError errors={[errors.name]} />
                  </Field>
                  <Field data-invalid={!!errors.idNumber}>
                    <FieldLabel htmlFor="idNumber">Cédula</FieldLabel>
                    <Input id="idNumber" aria-invalid={!!errors.idNumber} {...register("idNumber")} />
                    <FieldError errors={[errors.idNumber]} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.nationality}>
                    <FieldLabel htmlFor="nationality">Nacionalidad</FieldLabel>
                    <Controller
                      control={control}
                      name="nationality"
                      render={({ field }) => (
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <SelectTrigger id="nationality" className="w-full" aria-invalid={!!errors.nationality}>
                            <SelectValue placeholder="Selecciona tu nacionalidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {nationalityValues.map((value) => (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError errors={[errors.nationality]} />
                  </Field>
                  <Field data-invalid={!!errors.birthDate}>
                    <FieldLabel htmlFor="birthDate">Fecha de nacimiento</FieldLabel>
                    <Input id="birthDate" type="date" aria-invalid={!!errors.birthDate} {...register("birthDate")} />
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
                    <Input id="email" type="email" aria-invalid={!!errors.email} {...register("email")} />
                    <FieldError errors={[errors.email]} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.phone}>
                    <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                    <Input id="phone" aria-invalid={!!errors.phone} {...register("phone")} />
                    <FieldError errors={[errors.phone]} />
                  </Field>
                  <Field data-invalid={!!errors.address}>
                    <FieldLabel htmlFor="address">Dirección</FieldLabel>
                    <Input
                      id="address"
                      aria-invalid={!!errors.address}
                      {...register("address")}
                      onChange={(e) =>
                        setValue("address", toSentenceCase(e.target.value), {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />
                    <FieldError errors={[errors.address]} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field data-invalid={!!errors.maritalStatus}>
                    <FieldLabel htmlFor="maritalStatus">Estado civil</FieldLabel>
                    <Controller
                      control={control}
                      name="maritalStatus"
                      render={({ field }) => (
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <SelectTrigger id="maritalStatus" className="w-full" aria-invalid={!!errors.maritalStatus}>
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                          <SelectContent>
                            {maritalStatusValues.map((value) => (
                              <SelectItem key={value} value={value}>
                                {maritalStatusLabels[value]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
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
                      aria-invalid={!!errors.education}
                      {...register("education")}
                      onChange={(e) =>
                        setValue("education", toSentenceCase(e.target.value), {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
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
                    <FieldLabel>Idiomas</FieldLabel>
                    <Controller
                      control={control}
                      name="languages"
                      render={({ field }) => (
                        <div className="flex flex-wrap gap-2">
                          {languageValues.map((value) => {
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
                                {languageLabels[value]}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    />
                    <FieldDescription>Puedes elegir más de uno.</FieldDescription>
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
                      aria-invalid={!!errors.experienceYears}
                      {...register("experienceYears", { valueAsNumber: true })}
                    />
                    <FieldError errors={[errors.experienceYears]} />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Empresas anteriores</FieldLabel>
                  <FieldDescription className="-mt-1">
                    Si tienes, agrega una referencia de esa empresa justo debajo (opcional).
                  </FieldDescription>
                  <div className="flex flex-col gap-3">
                    {employers.fields.map((item, index) => {
                      const employerErrors = errors.previousEmployers?.[index];
                      return (
                        <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-border p-3">
                          <div className="grid gap-2 sm:grid-cols-4">
                            <div>
                              <Input
                                placeholder="Empresa"
                                aria-invalid={!!employerErrors?.company}
                                {...register(`previousEmployers.${index}.company` as const)}
                                onChange={(e) =>
                                  setValue(
                                    `previousEmployers.${index}.company`,
                                    toSentenceCase(e.target.value),
                                    { shouldValidate: true, shouldDirty: true },
                                  )
                                }
                              />
                              <FieldError errors={[employerErrors?.company]} />
                            </div>
                            <div>
                              <Input
                                placeholder="Puesto"
                                aria-invalid={!!employerErrors?.role}
                                {...register(`previousEmployers.${index}.role` as const)}
                                onChange={(e) =>
                                  setValue(`previousEmployers.${index}.role`, toSentenceCase(e.target.value), {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  })
                                }
                              />
                              <FieldError errors={[employerErrors?.role]} />
                            </div>
                            <div>
                              <Controller
                                control={control}
                                name={`previousEmployers.${index}.from` as const}
                                render={({ field }) => (
                                  <DatePickerField
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Desde"
                                    invalid={!!employerErrors?.from}
                                  />
                                )}
                              />
                              <FieldError errors={[employerErrors?.from]} />
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Controller
                                  control={control}
                                  name={`previousEmployers.${index}.to` as const}
                                  render={({ field }) => (
                                    <DatePickerField
                                      value={field.value}
                                      onChange={field.onChange}
                                      placeholder="Hasta"
                                    />
                                  )}
                                />
                              </div>
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

                          <div className="border-t border-dashed border-border pt-3">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                              Referencia de este trabajo (opcional)
                            </p>
                            <div className="grid gap-2 sm:grid-cols-3">
                              <Input
                                placeholder="Nombre"
                                {...register(`previousEmployers.${index}.referenceName` as const)}
                                onChange={(e) =>
                                  setValue(
                                    `previousEmployers.${index}.referenceName`,
                                    toSentenceCase(e.target.value),
                                    { shouldValidate: true, shouldDirty: true },
                                  )
                                }
                              />
                              <Input
                                placeholder="Teléfono"
                                {...register(`previousEmployers.${index}.referencePhone` as const)}
                              />
                              <Input
                                placeholder="Relación (ej. Supervisor)"
                                {...register(`previousEmployers.${index}.referenceRelation` as const)}
                                onChange={(e) =>
                                  setValue(
                                    `previousEmployers.${index}.referenceRelation`,
                                    toSentenceCase(e.target.value),
                                    { shouldValidate: true, shouldDirty: true },
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <Button
                      type="button"
                      size="sm"
                      className="w-fit gap-1"
                      onClick={() =>
                        employers.append({
                          company: "",
                          role: "",
                          from: "",
                          to: "",
                          referenceName: "",
                          referencePhone: "",
                          referenceRelation: "",
                        })
                      }
                    >
                      <Plus className="size-4" /> Agregar empresa anterior
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
            </FieldSet>
          ) : null}

          {step === 2 ? (
            <FieldSet>
              <p className="mb-4 text-sm text-muted-foreground">{APPLICATION_STEPS[2].description}</p>
              <FieldGroup>
                <Field data-invalid={!!errors.vehicleType} orientation="horizontal" className="flex-wrap">
                  <Controller
                    control={control}
                    name="hasVehicle"
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (!checked) setValue("vehicleType", "", { shouldValidate: true });
                        }}
                        id="hasVehicle"
                      />
                    )}
                  />
                  <FieldLabel htmlFor="hasVehicle" className="font-normal">
                    Cuento con vehículo o moto propia
                  </FieldLabel>
                  {hasVehicle ? (
                    <div className="ml-2 flex flex-col gap-1">
                      <Input
                        className="max-w-48"
                        placeholder="Tipo de vehículo"
                        aria-invalid={!!errors.vehicleType}
                        {...register("vehicleType")}
                        onChange={(e) =>
                          setValue("vehicleType", toSentenceCase(e.target.value), {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                      />
                      <FieldError errors={[errors.vehicleType]} />
                    </div>
                  ) : null}
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field data-invalid={!!errors.uniformShirtSize}>
                    <FieldLabel htmlFor="uniformShirtSize">Talla camisa</FieldLabel>
                    <Input id="uniformShirtSize" aria-invalid={!!errors.uniformShirtSize} {...register("uniformShirtSize")} />
                    <FieldError errors={[errors.uniformShirtSize]} />
                  </Field>
                  <Field data-invalid={!!errors.uniformPantsSize}>
                    <FieldLabel htmlFor="uniformPantsSize">Talla pantalón</FieldLabel>
                    <Input id="uniformPantsSize" aria-invalid={!!errors.uniformPantsSize} {...register("uniformPantsSize")} />
                    <FieldError errors={[errors.uniformPantsSize]} />
                  </Field>
                  <Field data-invalid={!!errors.uniformShoeSize}>
                    <FieldLabel htmlFor="uniformShoeSize">Talla calzado</FieldLabel>
                    <Input id="uniformShoeSize" aria-invalid={!!errors.uniformShoeSize} {...register("uniformShoeSize")} />
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
                    <Input
                      id="emergencyContactName"
                      aria-invalid={!!errors.emergencyContactName}
                      {...register("emergencyContactName")}
                      onChange={(e) =>
                        setValue("emergencyContactName", toSentenceCase(e.target.value), {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />
                    <FieldError errors={[errors.emergencyContactName]} />
                  </Field>
                  <Field data-invalid={!!errors.emergencyContactPhone}>
                    <FieldLabel htmlFor="emergencyContactPhone">Teléfono de emergencia</FieldLabel>
                    <Input
                      id="emergencyContactPhone"
                      aria-invalid={!!errors.emergencyContactPhone}
                      {...register("emergencyContactPhone")}
                    />
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
