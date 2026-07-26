/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogTrigger as DialogTrigger,
} from "@/components/shared/responsive-dialog";
import { setCompanyActiveAction, deleteCompanyAction } from "./actions";

interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  country: string;
  isActive: boolean;
  createdAt: Date;
  lastAccessedAt: Date | null;
  planName: string;
  planPriceMonthly: string;
  billingStatus: string;
  _count: { users: number; workers: number; clients: number; events: number };
}

const BILLING_STATUS_LABELS: Record<string, string> = {
  TRIAL: "Prueba",
  ACTIVE: "Al día",
  PAST_DUE: "Vencida",
  CANCELLED: "Cancelada",
};

const BILLING_STATUS_VARIANTS: Record<string, "secondary" | "outline" | "destructive"> = {
  TRIAL: "outline",
  ACTIVE: "secondary",
  PAST_DUE: "destructive",
  CANCELLED: "destructive",
};

function formatDate(date: Date | null) {
  if (!date) return "Nunca";
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(date);
}

export function CompanyList({ companies }: { companies: CompanyRow[] }) {
  if (companies.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Aún no hay empresas registradas. Crea la primera con el botón de arriba.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  );
}

function CompanyCard({ company }: { company: CompanyRow }) {
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    const result = await deleteCompanyAction(company.id, confirmName);
    setIsDeleting(false);
    if (result?.error) {
      setDeleteError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success(`Empresa "${company.name}" eliminada permanentemente`);
    setDeleteOpen(false);
  }

  function handleToggleActive() {
    startTransition(async () => {
      await setCompanyActiveAction(company.id, !company.isActive);
      toast.success(company.isActive ? "Empresa desactivada" : "Empresa activada");
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{company.name}</p>
            <p className="text-xs text-muted-foreground">
              {company.country} · /postulate/{company.slug}
            </p>
          </div>
          <Badge variant={company.isActive ? "secondary" : "outline"}>
            {company.isActive ? "Activa" : "Inactiva"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>{company._count.users} usuarios</span>
          <span>{company._count.workers} trabajadores</span>
          <span>{company._count.clients} clientes</span>
          <span>{company._count.events} eventos</span>
        </div>
        <div className="flex flex-col gap-1 border-t border-border pt-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Creada</span>
            <span className="text-foreground">{formatDate(company.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Último acceso</span>
            <span className="text-foreground">{formatDate(company.lastAccessedAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Plan</span>
            <span className="text-foreground">
              {company.planName} · ${Number(company.planPriceMonthly).toFixed(0)}/mes
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Facturación</span>
            <Badge variant={BILLING_STATUS_VARIANTS[company.billingStatus]} className="text-[10px]">
              {BILLING_STATUS_LABELS[company.billingStatus]}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={isPending}
            onClick={handleToggleActive}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {company.isActive ? "Desactivar" : "Activar"}
          </Button>
          <Dialog
            open={deleteOpen}
            onOpenChange={(open) => {
              setDeleteOpen(open);
              if (!open) {
                setConfirmName("");
                setDeleteError(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-danger" aria-label={`Eliminar ${company.name}`}>
                <Trash2 className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar {company.name} permanentemente</DialogTitle>
                <DialogDescription>
                  Esta acción borra <strong>para siempre</strong> esta empresa y todos sus datos:{" "}
                  {company._count.users} usuarios, {company._count.workers} trabajadores,{" "}
                  {company._count.clients} clientes y {company._count.events} eventos. No se puede
                  deshacer. Para confirmar, escribe el nombre exacto de la empresa.
                </DialogDescription>
              </DialogHeader>
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={company.name}
              />
              {deleteError ? <p className="text-sm text-danger">{deleteError}</p> : null}
              <DialogFooter>
                <Button
                  variant="destructive"
                  disabled={isDeleting || confirmName !== company.name}
                  onClick={handleDelete}
                >
                  {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Eliminar para siempre
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
