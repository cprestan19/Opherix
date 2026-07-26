/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
} from "@/components/shared/responsive-dialog";
import { FileUploadField } from "@/components/shared/file-upload-field";
import { DOCUMENT_TYPE_LABELS } from "@/lib/labels";
import {
  uploadWorkerDocumentAction,
  updateWorkerDocumentAction,
  deleteWorkerDocumentAction,
} from "./actions";
import type { DocumentType } from "@/generated/prisma/enums";

export interface WorkerDocumentItem {
  id: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  issuedAt: string;
  expiresAt: string;
}

interface FormState {
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  expiresAt: string;
}

const EMPTY_FORM: FormState = { type: "ID_CARD", fileName: "", fileUrl: "", expiresAt: "" };

export function WorkerDocumentsPanel({
  workerId,
  documents,
}: {
  workerId: string;
  documents: WorkerDocumentItem[];
}) {
  const [editing, setEditing] = useState<WorkerDocumentItem | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<WorkerDocumentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openNew() {
    setForm(EMPTY_FORM);
    setError(null);
    setEditing("new");
  }

  function openEdit(doc: WorkerDocumentItem) {
    setForm({ type: doc.type, fileName: doc.fileName, fileUrl: doc.fileUrl, expiresAt: doc.expiresAt });
    setError(null);
    setEditing(doc);
  }

  async function handleSave() {
    if (!form.fileUrl || !form.fileName) {
      setError("Sube un archivo.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const result =
      editing === "new"
        ? await uploadWorkerDocumentAction(workerId, {
            type: form.type,
            fileUrl: form.fileUrl,
            fileName: form.fileName,
            expiresAt: form.expiresAt || undefined,
          })
        : await updateWorkerDocumentAction(editing!.id, {
            type: form.type,
            fileUrl: form.fileUrl,
            fileName: form.fileName,
            expiresAt: form.expiresAt || undefined,
          });
    setIsSubmitting(false);
    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success(editing === "new" ? "Documento agregado correctamente" : "Documento actualizado correctamente");
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    setIsSubmitting(true);
    await deleteWorkerDocumentAction(deleting.id);
    setIsSubmitting(false);
    toast.success("Documento eliminado");
    setDeleting(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Documentos</p>
        <Button type="button" size="sm" className="gap-1" onClick={openNew}>
          <Plus className="size-4" /> Agregar documento
        </Button>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin documentos cargados.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{DOCUMENT_TYPE_LABELS[doc.type]}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {doc.fileName}
                    {doc.expiresAt ? ` · Vence ${doc.expiresAt}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button type="button" variant="ghost" size="icon" aria-label="Editar documento" onClick={() => openEdit(doc)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar documento"
                  className="text-danger hover:text-danger"
                  onClick={() => setDeleting(doc)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Agregar documento" : "Editar documento"}</DialogTitle>
            <DialogDescription>Acepta imágenes y PDF.</DialogDescription>
          </DialogHeader>
          <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as DocumentType }))}>
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
          <FileUploadField
            folder="/workers/documents"
            value={form.fileUrl ? { url: form.fileUrl, name: form.fileName } : undefined}
            onChange={(file) => setForm((f) => ({ ...f, fileUrl: file.url, fileName: file.name }))}
          />
          <div>
            <label className="text-xs text-muted-foreground">Fecha de vencimiento (opcional)</label>
            <Input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <DialogFooter>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar documento</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará &quot;{deleting?.fileName}&quot; del perfil.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
