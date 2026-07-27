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
import { specialtyValues, specialtyLabels } from "@/lib/validations/worker-application";
import { saveClientSpecialtyRatesAction } from "./actions";

interface ClientOption {
  id: string;
  businessName: string;
}

interface RateRecord {
  clientId: string;
  specialty: (typeof specialtyValues)[number];
  payToWorker: string;
  chargeToClient: string;
}

type RateMap = Record<string, { payToWorker: string; chargeToClient: string }>;

function ratesByClient(records: RateRecord[]): Record<string, RateMap> {
  const result: Record<string, RateMap> = {};
  for (const record of records) {
    result[record.clientId] ??= {};
    result[record.clientId][record.specialty] = {
      payToWorker: record.payToWorker,
      chargeToClient: record.chargeToClient,
    };
  }
  return result;
}

export function ClientRatesForm({ clients, records }: { clients: ClientOption[]; records: RateRecord[] }) {
  const initialRates = useMemo(() => ratesByClient(records), [records]);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [rates, setRates] = useState<RateMap>(initialRates[clients[0]?.id ?? ""] ?? {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleClientChange(nextClientId: string) {
    setClientId(nextClientId);
    setRates(initialRates[nextClientId] ?? {});
  }

  function updateRate(specialty: string, field: "payToWorker" | "chargeToClient", value: string) {
    setRates((prev) => {
      const current = prev[specialty] ?? { payToWorker: "0", chargeToClient: "0" };
      return { ...prev, [specialty]: { ...current, [field]: value } };
    });
  }

  async function handleSave() {
    if (!clientId) return;
    setIsSubmitting(true);
    const result = await saveClientSpecialtyRatesAction({
      clientId,
      rates: specialtyValues.map((specialty) => ({
        specialty,
        payToWorker: Number(rates[specialty]?.payToWorker ?? 0),
        chargeToClient: Number(rates[specialty]?.chargeToClient ?? 0),
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
            {specialtyValues.map((specialty) => (
              <tr key={specialty} className="border-b border-border last:border-0">
                <td className="px-3 py-2">{specialtyLabels[specialty]}</td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="max-w-32"
                    value={rates[specialty]?.payToWorker ?? "0"}
                    onChange={(e) => updateRate(specialty, "payToWorker", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="max-w-32"
                    value={rates[specialty]?.chargeToClient ?? "0"}
                    onChange={(e) => updateRate(specialty, "chargeToClient", e.target.value)}
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
