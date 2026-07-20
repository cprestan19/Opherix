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
import { Loader2, UserRound, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PhotoUploadFieldProps {
  folder: string;
  value?: string;
  onChange: (url: string) => void;
}

export function PhotoUploadField({ folder, value, onChange }: PhotoUploadFieldProps) {
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
      if (!authRes.ok) throw new Error("No se pudo iniciar la carga de la foto");
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

      if (result.url) onChange(result.url);
    } catch {
      setError("No se pudo subir la foto. Intenta de nuevo.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        <AvatarImage src={value} alt="Foto" />
        <AvatarFallback>
          <UserRound className="size-6 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          size="sm"
          className="gap-2"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {value ? "Cambiar foto" : "Subir foto"}
        </Button>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
