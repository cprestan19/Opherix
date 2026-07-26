/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@imagekit/react";
import { Camera, Loader2, RotateCcw, UserRound, Upload, ZoomIn, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from "@/components/shared/responsive-dialog";

interface PhotoCaptureFieldProps {
  folder: string;
  value?: string;
  onChange: (url: string) => void;
}

const CROP_SIZE = 260; // tamaño del visor circular en pantalla, en px
const OUTPUT_SIZE = 512; // resolución del recorte final que se sube

type Step = "camera" | "crop";

export function PhotoCaptureField({ folder, value, onChange }: PhotoCaptureFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function openCamera() {
    setError(null);
    setCameraError(null);
    setSourceImage(null);
    setStep("camera");
    setOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError("No se pudo acceder a la cámara. Puedes subir una foto desde tu galería.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    stopCamera();
    setSourceImage(canvas.toDataURL("image/png"));
    setStep("crop");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setError(null);
      setSourceImage(reader.result as string);
      setStep("crop");
      setOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // Al cargar la imagen a recortar, centrarla y calcular el zoom mínimo que
  // cubre el visor circular por completo (comportamiento "cover", como el
  // recorte de foto de perfil de cualquier app).
  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    const { naturalWidth, naturalHeight } = img;
    const cover = CROP_SIZE / Math.min(naturalWidth, naturalHeight);
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
    setBaseScale(cover);
    setScale(cover);
    setOffset({
      x: (CROP_SIZE - naturalWidth * cover) / 2,
      y: (CROP_SIZE - naturalHeight * cover) / 2,
    });
  }

  function handleZoomChange([value]: number[]) {
    const newScale = value;
    setOffset((prev) => {
      const centerImgX = CROP_SIZE / 2 - prev.x;
      const centerImgY = CROP_SIZE / 2 - prev.y;
      const ratio = newScale / scale;
      return {
        x: CROP_SIZE / 2 - centerImgX * ratio,
        y: CROP_SIZE / 2 - centerImgY * ratio,
      };
    });
    setScale(newScale);
  }

  function clampOffset(next: { x: number; y: number }, currentScale: number) {
    const w = naturalSize.width * currentScale;
    const h = naturalSize.height * currentScale;
    const minX = Math.min(0, CROP_SIZE - w);
    const minY = Math.min(0, CROP_SIZE - h);
    return {
      x: Math.min(0, Math.max(next.x, minX)),
      y: Math.min(0, Math.max(next.y, minY)),
    };
  }

  function handlePointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setOffset(
      clampOffset({ x: dragRef.current.offsetX + dx, y: dragRef.current.offsetY + dy }, scale),
    );
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function centerImage() {
    setOffset({
      x: (CROP_SIZE - naturalSize.width * scale) / 2,
      y: (CROP_SIZE - naturalSize.height * scale) / 2,
    });
  }

  async function handleConfirmCrop() {
    if (!sourceImage) return;
    setIsUploading(true);
    setError(null);
    try {
      const renderScale = OUTPUT_SIZE / CROP_SIZE;
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo procesar la imagen.");

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
        img.src = sourceImage;
      });

      ctx.drawImage(
        img,
        offset.x * renderScale,
        offset.y * renderScale,
        naturalSize.width * scale * renderScale,
        naturalSize.height * scale * renderScale,
      );

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("No se pudo generar la imagen.");

      const authRes = await fetch("/api/imagekit/auth");
      if (!authRes.ok) throw new Error("No se pudo iniciar la carga de la foto");
      const auth = await authRes.json();

      const file = new File([blob], "foto-perfil.jpg", { type: "image/jpeg" });
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
        setOpen(false);
        if (previousUrl && previousUrl !== result.url) {
          fetch("/api/imagekit/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: previousUrl }),
          }).catch((err) => console.error("[PhotoCaptureField] cleanup failed", err));
        }
      }
    } catch (err) {
      console.error("[PhotoCaptureField] upload failed", err);
      setError("No se pudo subir la foto. Intenta de nuevo.");
    } finally {
      setIsUploading(false);
    }
  }

  useEffect(() => stopCamera, []);

  function handleOpenChange(next: boolean) {
    if (!next) stopCamera();
    setOpen(next);
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        <AvatarImage src={value} alt="Foto" />
        <AvatarFallback>
          <UserRound className="size-6 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" className="gap-2" onClick={openCamera}>
            <Camera className="size-4" />
            Tomar foto
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" />
            {value ? "Cambiar foto" : "Subir foto"}
          </Button>
        </div>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{step === "camera" ? "Tomar foto" : "Ajusta tu foto"}</DialogTitle>
            <DialogDescription>
              {step === "camera"
                ? "Centra tu cara dentro del círculo y presiona el botón para capturar."
                : "Arrastra para mover y usa el control de zoom para que se vea bien tu cara."}
            </DialogDescription>
          </DialogHeader>

          {step === "camera" ? (
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative overflow-hidden rounded-full bg-muted"
                style={{ width: CROP_SIZE, height: CROP_SIZE }}
              >
                {cameraError ? (
                  <p className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                    {cameraError}
                  </p>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="size-full object-cover [transform:scaleX(-1)]"
                  />
                )}
                <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-inset ring-primary/60" />
              </div>
              <Button type="button" size="lg" className="gap-2" onClick={capturePhoto} disabled={!!cameraError}>
                <Camera className="size-4" />
                Capturar
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative touch-none overflow-hidden rounded-full bg-muted"
                style={{ width: CROP_SIZE, height: CROP_SIZE, cursor: "grab" }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                {sourceImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    ref={imgRef}
                    src={sourceImage}
                    alt="Foto a recortar"
                    onLoad={handleImageLoad}
                    draggable={false}
                    className="absolute top-0 left-0 max-w-none select-none"
                    style={{
                      width: naturalSize.width,
                      height: naturalSize.height,
                      transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                      transformOrigin: "top left",
                    }}
                  />
                ) : null}
                <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-inset ring-primary/60" />
              </div>
              <div className="flex w-full max-w-56 items-center gap-2">
                <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
                <Slider
                  min={baseScale}
                  max={baseScale * 3}
                  step={baseScale / 100}
                  value={[scale]}
                  onValueChange={handleZoomChange}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Arrastra la foto para moverla, o usa &quot;Centrar&quot; para ubicarla en el medio.
              </p>
              {error ? <p className="text-xs text-danger">{error}</p> : null}
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={centerImage}>
                  <LocateFixed className="size-3.5" />
                  Centrar
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={openCamera}>
                  <RotateCcw className="size-3.5" />
                  Tomar otra
                </Button>
                <Button type="button" size="sm" className="gap-1.5" disabled={isUploading} onClick={handleConfirmCrop}>
                  {isUploading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Usar esta foto
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
