/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { upload } from "@imagekit/react";
import { Building2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoUploadFieldProps {
  folder: string;
  value?: string;
  onChange: (url: string) => void;
}

/**
 * Subida directa (sin cámara ni recorte, a diferencia de PhotoCaptureField
 * — un logo no necesita encuadre circular) a ImageKit para el logo de la
 * empresa (§ Configuración > Branding). Se usa también en los recibos PDF.
 */
export function LogoUploadField({ folder, value, onChange }: LogoUploadFieldProps) {
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

      if (result.url) {
        const previousUrl = value;
        onChange(result.url);
        if (previousUrl && previousUrl !== result.url) {
          fetch("/api/imagekit/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: previousUrl }),
          }).catch((err) => console.error("[LogoUploadField] cleanup failed", err));
        }
      }
    } catch {
      setError("No se pudo subir la imagen. Intenta de nuevo.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
        {value ? (
          <Image src={value} alt="Logo de la empresa" width={80} height={80} className="size-full object-contain" />
        ) : (
          <Building2 className="size-8 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit gap-1.5"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
          {value ? "Cambiar logo" : "Subir logo"}
        </Button>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
    </div>
  );
}
