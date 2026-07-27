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
import Link from "next/link";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Briefcase,
  CalendarClock,
  FileText,
  HeartPulse,
  Loader2,
  Plus,
  Save,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import { workerEditSchema, type WorkerEditInput } from "@/lib/validations/worker-edit";
import { specialtyValues, specialtyLabels } from "@/lib/validations/worker-application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { ChipInput } from "@/components/shared/chip-input";
import { PhotoCaptureField } from "@/components/shared/photo-capture-field";
import { cn } from "@/lib/utils";
import { updateWorkerAction } from "./actions";
import { WorkerDocumentsPanel, type WorkerDocumentItem } from "./worker-documents-panel";
import { WorkerAvailabilityEditor } from "./worker-availability-editor";

interface EditWorkerFormProps {
  workerId: string;
  worker: WorkerEditInput;
  ratingAverage: string;
  ratingCount: number;
  documents: WorkerDocumentItem[];
  availabilitySlots: { dayOfWeek: number; startTime: string; endTime: string }[];
}

const TABS = [
  { value: "perfil", label: "Perfil", icon: UserRound },
  { value: "laboral", label: "Laboral", icon: Briefcase },
  { value: "salud", label: "Salud", icon: HeartPulse },
  { value: "disponibilidad", label: "Disponibilidad", icon: CalendarClock },
  { value: "documentos", label: "Documentos", icon: FileText },
] as const;

const TAB_FIELDS: Record<(typeof TABS)[number]["value"], (keyof WorkerEditInput)[]> = {
  perfil: [
    "name",
    "email",
    "phone",
    "idNumber",
    "nationality",
    "birthDate",
    "address",
    "maritalStatus",
    "hasChildren",
    "childrenCount",
  ],
  laboral: [
    "education",
    "courses",
    "languages",
    "specialties",
    "experienceYears",
    "previousEmployers",
    "licenses",
    "hasVehicle",
    "vehicleType",
    "uniformShirtSize",
    "uniformPantsSize",
    "uniformShoeSize",
  ],
  salud: ["emergencyContactName", "emergencyContactPhone", "allergies", "conditions"],
  disponibilidad: [],
  documentos: [],
};

export function EditWorkerForm({
  workerId,
  worker,
  ratingAverage,
  ratingCount,
  documents,
  availabilitySlots,
}: EditWorkerFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["value"]>("perfil");
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WorkerEditInput>({ resolver: zodResolver(workerEditSchema), defaultValues: worker });

  const employers = useFieldArray({ control, name: "previousEmployers" });
  const hasChildren = watch("hasChildren");
  const hasVehicle = watch("hasVehicle");
  const name = watch("name");
  const specialties = watch("specialties");

  async function onSubmit(values: WorkerEditInput) {
    setServerError(null);
    const result = await updateWorkerAction(workerId, values);
    if (result?.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Perfil guardado correctamente");
    router.push(`/admin/personal/${workerId}`);
  }

  function onInvalid(formErrors: typeof errors) {
    const invalidFields = new Set(Object.keys(formErrors));
    const tabWithError = TABS.find(({ value }) => TAB_FIELDS[value].some((field) => invalidFields.has(field)));
    if (tabWithError) setActiveTab(tabWithError.value);
    toast.error("Revisa los campos marcados en rojo antes de guardar.");
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      <Link
        href={`/admin/personal/${workerId}`}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver al perfil
      </Link>

      {/* Header visual */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <Card className="overflow-hidden border-violet-6 bg-gradient-to-br from-violet-3 to-background">
          <CardContent className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
            <Controller
              control={control}
              name="photoUrl"
              render={({ field }) => (
                <PhotoCaptureField folder="/workers/photos" value={field.value} onChange={field.onChange} />
              )}
            />
            <div className="flex flex-col gap-1.5">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{name || "Editar trabajador"}</h1>
              <div className="flex flex-wrap items-center gap-1.5">
                {specialties.map((specialty) => (
                  <Badge key={specialty} className="w-fit">
                    {specialtyLabels[specialty]}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="size-3.5 fill-warning text-warning" />
                {Number(ratingAverage).toFixed(1)} ({ratingCount} evaluaciones)
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex flex-col gap-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as (typeof TABS)[number]["value"])}>
          <TabsList className="h-auto flex-wrap gap-1 bg-muted/60 p-1">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="gap-1.5 px-3 py-1.5">
                <Icon className="size-4" /> {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="perfil" className="mt-4">
            <Card>
              <CardContent className="p-5">
                <FieldSet>
                  <FieldGroup>
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
                      <Field data-invalid={!!errors.email}>
                        <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                        <Input id="email" type="email" {...register("email")} />
                        <FieldError errors={[errors.email]} />
                      </Field>
                      <Field data-invalid={!!errors.phone}>
                        <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                        <Input id="phone" {...register("phone")} />
                        <FieldError errors={[errors.phone]} />
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field data-invalid={!!errors.nationality}>
                        <FieldLabel htmlFor="nationality">Nacionalidad</FieldLabel>
                        <Input id="nationality" {...register("nationality")} />
                        <FieldError errors={[errors.nationality]} />
                      </Field>
                      <Field data-invalid={!!errors.birthDate}>
                        <FieldLabel htmlFor="birthDate">Fecha de nacimiento</FieldLabel>
                        <Input id="birthDate" type="date" {...register("birthDate")} />
                        <FieldError errors={[errors.birthDate]} />
                      </Field>
                    </div>
                    <Field data-invalid={!!errors.address}>
                      <FieldLabel htmlFor="address">Dirección</FieldLabel>
                      <Input id="address" {...register("address")} />
                      <FieldError errors={[errors.address]} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field data-invalid={!!errors.maritalStatus}>
                        <FieldLabel htmlFor="maritalStatus">Estado civil</FieldLabel>
                        <Input id="maritalStatus" {...register("maritalStatus")} />
                        <FieldError errors={[errors.maritalStatus]} />
                      </Field>
                      <Field orientation="horizontal" className="sm:items-end sm:pb-2">
                        <Controller
                          control={control}
                          name="hasChildren"
                          render={({ field }) => (
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} id="hasChildren" />
                          )}
                        />
                        <FieldLabel htmlFor="hasChildren" className="font-normal">
                          Tiene hijos
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="laboral" className="mt-4">
            <Card>
              <CardContent className="p-5">
                <FieldSet>
                  <FieldGroup>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field data-invalid={!!errors.education}>
                        <FieldLabel htmlFor="education">Escolaridad</FieldLabel>
                        <Input id="education" {...register("education")} />
                        <FieldError errors={[errors.education]} />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="courses">Cursos</FieldLabel>
                        <Controller
                          control={control}
                          name="courses"
                          render={({ field }) => <ChipInput id="courses" value={field.value} onChange={field.onChange} />}
                        />
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field data-invalid={!!errors.languages}>
                        <FieldLabel htmlFor="languages">Idiomas</FieldLabel>
                        <Controller
                          control={control}
                          name="languages"
                          render={({ field }) => <ChipInput id="languages" value={field.value} onChange={field.onChange} />}
                        />
                        <FieldError errors={[errors.languages]} />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="licenses">Licencias</FieldLabel>
                        <Controller
                          control={control}
                          name="licenses"
                          render={({ field }) => <ChipInput id="licenses" value={field.value} onChange={field.onChange} />}
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
                                        checked ? field.value.filter((v) => v !== value) : [...field.value, value],
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
                      <FieldDescription className="-mt-1">
                        Referencia de esa empresa (opcional), justo debajo de cada una.
                      </FieldDescription>
                      <div className="flex flex-col gap-3">
                        {employers.fields.map((item, index) => (
                          <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-border p-3">
                            <div className="grid gap-2 sm:grid-cols-4">
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
                            <div className="border-t border-dashed border-border pt-3">
                              <p className="mb-2 text-xs font-medium text-muted-foreground">
                                Referencia de este trabajo (opcional)
                              </p>
                              <div className="grid gap-2 sm:grid-cols-3">
                                <Input
                                  placeholder="Nombre"
                                  {...register(`previousEmployers.${index}.referenceName` as const)}
                                />
                                <Input
                                  placeholder="Teléfono"
                                  {...register(`previousEmployers.${index}.referencePhone` as const)}
                                />
                                <Input
                                  placeholder="Relación"
                                  {...register(`previousEmployers.${index}.referenceRelation` as const)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
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

                    <Field orientation="horizontal">
                      <Controller
                        control={control}
                        name="hasVehicle"
                        render={({ field }) => (
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} id="hasVehicle" />
                        )}
                      />
                      <FieldLabel htmlFor="hasVehicle" className="font-normal">
                        Cuenta con vehículo o moto propia
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
                  </FieldGroup>
                </FieldSet>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salud" className="mt-4">
            <Card>
              <CardContent className="p-5">
                <FieldSet>
                  <FieldGroup>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="allergies">Alergias</FieldLabel>
                        <Textarea id="allergies" rows={3} {...register("allergies")} />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="conditions">Condiciones médicas</FieldLabel>
                        <Textarea id="conditions" rows={3} {...register("conditions")} />
                      </Field>
                    </div>
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
                    <FieldDescription className="flex items-center gap-1.5">
                      <HeartPulse className="size-3.5" />
                      La información de salud es confidencial: solo la ve el equipo administrativo, nunca los
                      clientes.
                    </FieldDescription>
                  </FieldGroup>
                </FieldSet>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disponibilidad" className="mt-4">
            <Card>
              <CardContent className="p-5">
                <WorkerAvailabilityEditor workerId={workerId} slots={availabilitySlots} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos" className="mt-4">
            <Card>
              <CardContent className="p-5">
                <WorkerDocumentsPanel workerId={workerId} documents={documents} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

        <div className="sticky bottom-4 flex justify-end">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur">
            <Button type="button" variant="ghost" asChild>
              <Link href={`/admin/personal/${workerId}`}>Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Guardar cambios
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
