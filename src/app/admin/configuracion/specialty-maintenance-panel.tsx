/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useState } from "react";
import { Loader2, Plus, Pencil, Archive, ArchiveRestore, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createSpecialtyAction,
  renameSpecialtyAction,
  archiveSpecialtyAction,
  restoreSpecialtyAction,
} from "./actions";

interface SpecialtyItem {
  id: string;
  name: string;
  archivedAt: Date | null;
}

export function SpecialtyMaintenancePanel({ specialties }: { specialties: SpecialtyItem[] }) {
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleCreate() {
    if (!newName.trim()) return;
    setIsCreating(true);
    const result = await createSpecialtyAction({ name: newName });
    setIsCreating(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Especialidad creada correctamente");
    setNewName("");
  }

  function startEdit(specialty: SpecialtyItem) {
    setEditingId(specialty.id);
    setEditingName(specialty.name);
  }

  async function handleRename(id: string) {
    if (!editingName.trim()) return;
    setPendingId(id);
    const result = await renameSpecialtyAction({ id, name: editingName });
    setPendingId(null);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Especialidad actualizada");
    setEditingId(null);
  }

  async function handleArchive(specialty: SpecialtyItem) {
    setPendingId(specialty.id);
    const result = await archiveSpecialtyAction({ id: specialty.id });
    setPendingId(null);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`"${specialty.name}" archivada — ya no aparece para asignaciones nuevas`);
  }

  async function handleRestore(specialty: SpecialtyItem) {
    setPendingId(specialty.id);
    const result = await restoreSpecialtyAction({ id: specialty.id });
    setPendingId(null);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`"${specialty.name}" reactivada`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2">
        <Input
          placeholder="Nueva especialidad (ej. Valet, Supervisor de acceso)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 sm:max-w-xs"
        />
        <Button onClick={handleCreate} disabled={isCreating || !newName.trim()} className="gap-1">
          {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Agregar
        </Button>
      </div>

      {specialties.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay especialidades configuradas.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {specialties.map((specialty) => {
            const isArchived = specialty.archivedAt !== null;
            const isEditing = editingId === specialty.id;
            const isPending = pendingId === specialty.id;

            return (
              <li
                key={specialty.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                {isEditing ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-8"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Guardar nombre"
                      disabled={isPending}
                      onClick={() => handleRename(specialty.id)}
                    >
                      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Cancelar" onClick={() => setEditingId(null)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <span className={isArchived ? "text-muted-foreground" : ""}>
                    {specialty.name}
                    {isArchived ? (
                      <Badge variant="secondary" className="ml-2">
                        Archivada
                      </Badge>
                    ) : null}
                  </span>
                )}

                {isEditing ? null : (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${specialty.name}`}
                      onClick={() => startEdit(specialty)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {isArchived ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Reactivar ${specialty.name}`}
                        disabled={isPending}
                        onClick={() => handleRestore(specialty)}
                      >
                        {isPending ? <Loader2 className="size-4 animate-spin" /> : <ArchiveRestore className="size-4" />}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Archivar ${specialty.name}`}
                        disabled={isPending}
                        onClick={() => handleArchive(specialty)}
                      >
                        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
                      </Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
