/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogTrigger as DialogTrigger,
} from "@/components/shared/responsive-dialog";
import { Textarea } from "@/components/ui/textarea";
import { specialtyLabels } from "@/lib/validations/worker-application";
import type { listPendingApplications } from "@/services/recruitment.service";
import { approveApplicationAction, rejectApplicationAction } from "./actions";

type Application = Awaited<ReturnType<typeof listPendingApplications>>[number];

export function ApplicationReviewList({ applications }: { applications: Application[] }) {
  if (applications.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No hay postulaciones pendientes de revisión.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {applications.map((application) => (
        <ApplicationCard key={application.id} application={application} />
      ))}
    </div>
  );
}

function ApplicationCard({ application }: { application: Application }) {
  const [isPending, startTransition] = useTransition();
  const [rejectReason, setRejectReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleApprove() {
    startTransition(async () => {
      await approveApplicationAction(application.id);
    });
  }

  function handleReject() {
    startTransition(async () => {
      await rejectApplicationAction(application.id, rejectReason || "No especificado");
      setDialogOpen(false);
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-11">
            <AvatarImage src={application.photoUrl ?? undefined} alt={application.user.name} />
            <AvatarFallback>{application.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{application.user.name}</p>
            <p className="text-sm text-muted-foreground">
              {application.user.email} · {application.user.phone}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {application.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary">
                  {specialtyLabels[specialty]}
                </Badge>
              ))}
              <span className="text-xs text-muted-foreground">
                {application.experienceYears ?? 0} años de experiencia
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 text-danger" disabled={isPending}>
                <X className="size-4" /> Rechazar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rechazar postulación</DialogTitle>
                <DialogDescription>
                  Indica el motivo. {application.user.name} podrá verlo en su portal.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motivo del rechazo"
                rows={3}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={isPending}>
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Confirmar rechazo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button size="sm" className="gap-1" onClick={handleApprove} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Aprobar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
