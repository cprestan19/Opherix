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
import { Loader2, MapPin, Camera, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from "@/components/shared/responsive-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CheckMethodPayload } from "@/services/checkin.service";

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  mode: "in" | "out";
  defaultCode?: string;
  onSubmit: (payload: CheckMethodPayload) => Promise<{ error?: string } | void>;
}

export function CheckInDialog({ open, onOpenChange, title, mode, defaultCode, onSubmit }: CheckInDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [code, setCode] = useState(defaultCode ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleGps() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Tu dispositivo no soporta geolocalización.");
      return;
    }
    setIsSubmitting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const result = await onSubmit({
          method: "GPS",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsSubmitting(false);
        if (result?.error) setError(result.error);
        else onOpenChange(false);
      },
      () => {
        setIsSubmitting(false);
        setError("No se pudo obtener tu ubicación. Revisa los permisos del navegador.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleSelfieFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    setError(null);
    try {
      const authRes = await fetch("/api/imagekit/auth");
      const auth = await authRes.json();
      const result = await upload({
        file,
        fileName: file.name,
        folder: "/checkins",
        publicKey: auth.publicKey,
        token: auth.token,
        expire: auth.expire,
        signature: auth.signature,
        useUniqueFileName: true,
      });
      setPhotoUrl(result.url ?? undefined);
    } catch {
      setError("No se pudo subir la foto.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function submitSelfie() {
    if (!photoUrl) {
      setError("Toma una selfie primero.");
      return;
    }
    setIsSubmitting(true);
    const result = await onSubmit({ method: "SELFIE", photoUrl });
    setIsSubmitting(false);
    if (result?.error) setError(result.error);
    else onOpenChange(false);
  }

  async function submitCode() {
    setIsSubmitting(true);
    const result = await onSubmit({ method: "SUPERVISOR_CODE", code });
    setIsSubmitting(false);
    if (result?.error) setError(result.error);
    else onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "in" ? "Registrar entrada" : "Registrar salida"}</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="gps">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gps" className="gap-1">
              <MapPin className="size-3.5" /> GPS
            </TabsTrigger>
            <TabsTrigger value="selfie" className="gap-1">
              <Camera className="size-3.5" /> Selfie
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-1">
              <KeyRound className="size-3.5" /> Código
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gps" className="flex flex-col gap-3 pt-4">
            <p className="text-sm text-muted-foreground">
              Usaremos tu ubicación actual para confirmar que estás en el evento.
            </p>
            <Button onClick={handleGps} disabled={isSubmitting} className="gap-2">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
              Usar mi ubicación
            </Button>
          </TabsContent>

          <TabsContent value="selfie" className="flex flex-col gap-3 pt-4">
            <p className="text-sm text-muted-foreground">Toma una foto para verificar tu asistencia.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleSelfieFile}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="gap-2"
            >
              {isUploadingPhoto ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              {photoUrl ? "Foto lista — tomar otra" : "Tomar selfie"}
            </Button>
            <Button onClick={submitSelfie} disabled={!photoUrl || isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirmar con selfie
            </Button>
          </TabsContent>

          <TabsContent value="code" className="flex flex-col gap-3 pt-4">
            <p className="text-sm text-muted-foreground">
              Ingresa el código QR/código de supervisor que te dieron en el evento.
            </p>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código de 6 dígitos" />
            <Button onClick={submitCode} disabled={!code || isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirmar con código
            </Button>
          </TabsContent>
        </Tabs>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
