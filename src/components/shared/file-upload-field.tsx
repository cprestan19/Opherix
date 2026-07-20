/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useRef, useState } from "react";
import { upload } from "@imagekit/react";
import { Loader2, Upload, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadFieldProps {
  folder: string;
  value?: { url: string; name: string };
  onChange: (file: { url: string; name: string }) => void;
}

export function FileUploadField({ folder, value, onChange }: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const authRes = await fetch("/api/imagekit/auth");
      if (!authRes.ok) throw new Error("No se pudo iniciar la carga");
      const auth = await authRes.json();

      const result = await upload({
        file,
        fileName: file.name,
        folder,
        publicKey: auth.publicKey,
        token: auth.token,
        expire: auth.expire,
        signature: auth.signature,
        useUniqueFileName: true,
      });

      if (result.url) onChange({ url: result.url, name: file.name });
    } catch {
      setError("No se pudo subir el archivo. Intenta de nuevo.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        size="sm"
        className="w-fit gap-2"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : value ? (
          <FileCheck className="size-4 text-success" />
        ) : (
          <Upload className="size-4" />
        )}
        {value ? value.name : "Subir archivo"}
      </Button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
