/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogTrigger as DialogTrigger,
} from "@/components/shared/responsive-dialog";
import { FileUploadField } from "@/components/shared/file-upload-field";
import { uploadDocumentAction } from "./actions";
import type { DocumentType } from "@/generated/prisma/enums";

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ID_CARD: "Cédula",
  RESUME: "Currículum",
  HEALTH_CARD: "Carnet de salud",
  FOOD_HANDLING: "Manipulación de alimentos",
  LICENSE: "Licencia",
  CERTIFICATE: "Certificado",
  OTHER: "Otro",
};

export function DocumentUploadForm() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<DocumentType>("ID_CARD");
  const [file, setFile] = useState<{ url: string; name: string } | undefined>();
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!file) return;
    setIsSubmitting(true);
    await uploadDocumentAction({
      type,
      fileUrl: file.url,
      fileName: file.name,
      expiresAt: expiresAt || undefined,
    });
    setIsSubmitting(false);
    setOpen(false);
    setFile(undefined);
    setExpiresAt("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <Plus className="size-4" /> Subir documento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir documento</DialogTitle>
          <DialogDescription>Acepta imágenes y PDF.</DialogDescription>
        </DialogHeader>
        <Select value={type} onValueChange={(v) => setType(v as DocumentType)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FileUploadField folder="/documents" value={file} onChange={setFile} />
        <div>
          <label className="text-xs text-muted-foreground">Fecha de vencimiento (opcional)</label>
          <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!file || isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
