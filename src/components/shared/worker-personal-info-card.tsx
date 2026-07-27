/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import { IdCard, Car, Shirt, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { asUniformSizes } from "@/lib/worker-fields";
import { maritalStatusLabels } from "@/lib/validations/worker-application";

export interface WorkerPersonalInfoData {
  idNumber: string | null;
  nationality: string | null;
  birthDate: Date | null;
  maritalStatus: string | null;
  hasChildren: boolean;
  childrenCount: number | null;
  hasVehicle: boolean;
  vehicleType: string | null;
  uniformSizes: unknown;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

const dateFormatter = new Intl.DateTimeFormat("es", { day: "2-digit", month: "long", year: "numeric" });

function maritalStatusLabel(value: string | null): string {
  if (!value) return "—";
  return (maritalStatusLabels as Record<string, string>)[value] ?? value;
}

/** Datos personales completos de la postulación — cédula, vehículo, tallas, contacto de emergencia, etc. */
export function WorkerPersonalInfoCard({ worker }: { worker: WorkerPersonalInfoData }) {
  const uniform = asUniformSizes(worker.uniformSizes);

  return (
    <Card>
      <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2.5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <IdCard className="size-4" /> Datos personales
          </h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Cédula</dt>
            <dd>{worker.idNumber || "—"}</dd>
            <dt className="text-muted-foreground">Nacionalidad</dt>
            <dd>{worker.nationality || "—"}</dd>
            <dt className="text-muted-foreground">Nacimiento</dt>
            <dd>{worker.birthDate ? dateFormatter.format(worker.birthDate) : "—"}</dd>
            <dt className="text-muted-foreground">Estado civil</dt>
            <dd>{maritalStatusLabel(worker.maritalStatus)}</dd>
            <dt className="text-muted-foreground">Hijos</dt>
            <dd>{worker.hasChildren ? `Sí (${worker.childrenCount ?? 0})` : "No"}</dd>
          </dl>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2.5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Car className="size-4" /> Vehículo
            </h3>
            <p className="text-sm text-muted-foreground">
              {worker.hasVehicle ? worker.vehicleType || "Sí (sin especificar tipo)" : "No cuenta con vehículo propio"}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Shirt className="size-4" /> Tallas de uniforme
            </h3>
            <p className="text-sm text-muted-foreground">
              Camisa {uniform.shirt || "—"} · Pantalón {uniform.pants || "—"} · Calzado {uniform.shoes || "—"}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Phone className="size-4" /> Contacto de emergencia
            </h3>
            <p className="text-sm text-muted-foreground">
              {worker.emergencyContactName || "—"}
              {worker.emergencyContactPhone ? ` · ${worker.emergencyContactPhone}` : ""}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
