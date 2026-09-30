/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveClientSpecialtyRatesAction } from "./actions";

interface ClientOption {
  id: string;
  businessName: string;
}

interface SpecialtyOption {
  id: string;
  name: string;
}

interface RateRecord {
  clientId: string;
  specialtyId: string;
  payToWorker: string;
  chargeToClient: string;
}

type RateMap = Record<string, { payToWorker: string; chargeToClient: string }>;

function ratesByClient(records: RateRecord[]): Record<string, RateMap> {
  const result: Record<string, RateMap> = {};
  for (const record of records) {
    result[record.clientId] ??= {};
    result[record.clientId][record.specialtyId] = {
      payToWorker: record.payToWorker,
      chargeToClient: record.chargeToClient,
    };
  }
  return result;
}

export function ClientRatesForm({
  clients,
  specialties,
  records,
}: {
  clients: ClientOption[];
  specialties: SpecialtyOption[];
  records: RateRecord[];
}) {
  const initialRates = useMemo(() => ratesByClient(records), [records]);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [rates, setRates] = useState<RateMap>(initialRates[clients[0]?.id ?? ""] ?? {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleClientChange(nextClientId: string) {
    setClientId(nextClientId);
    setRates(initialRates[nextClientId] ?? {});
  }

  function updateRate(specialtyId: string, field: "payToWorker" | "chargeToClient", value: string) {
    setRates((prev) => {
      const current = prev[specialtyId] ?? { payToWorker: "0", chargeToClient: "0" };
      return { ...prev, [specialtyId]: { ...current, [field]: value } };
    });
  }

  async function handleSave() {
    if (!clientId) return;
    setIsSubmitting(true);
    const result = await saveClientSpecialtyRatesAction({
      clientId,
      rates: specialties.map((specialty) => ({
        specialtyId: specialty.id,
        payToWorker: Number(rates[specialty.id]?.payToWorker ?? 0),
        chargeToClient: Number(rates[specialty.id]?.chargeToClient ?? 0),
      })),
    });
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Tarifas guardadas correctamente");
  }

  if (clients.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Registra primero un cliente en /admin/clientes para poder configurar sus tarifas.
      </p>
    );
  }

  if (specialties.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay especialidades activas — agrega al menos una en &quot;Mantenimiento de especialidades&quot; arriba.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Field className="max-w-sm">
        <FieldLabel>Cliente</FieldLabel>
        <Select value={clientId} onValueChange={handleClientChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.businessName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Especialidad</th>
              <th className="px-3 py-2 font-medium">Pago al personal</th>
              <th className="px-3 py-2 font-medium">Cobro al cliente</th>
            </tr>
          </thead>
          <tbody>
            {specialties.map((specialty) => (
              <tr key={specialty.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">{specialty.name}</td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="max-w-32"
                    value={rates[specialty.id]?.payToWorker ?? "0"}
                    onChange={(e) => updateRate(specialty.id, "payToWorker", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="max-w-32"
                    value={rates[specialty.id]?.chargeToClient ?? "0"}
                    onChange={(e) => updateRate(specialty.id, "chargeToClient", e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button onClick={handleSave} disabled={isSubmitting} className="w-fit gap-2">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Guardar tarifas
      </Button>
    </div>
  );
}
