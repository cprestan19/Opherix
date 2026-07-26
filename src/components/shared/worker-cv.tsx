/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Loader2,
  Mail,
  Phone,
  Star,
  MapPin,
  Languages,
  GraduationCap,
  Briefcase,
  BadgeCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { specialtyLabels, languageLabels } from "@/lib/validations/worker-application";
import { StaggerContainer, StaggerItem } from "@/components/shared/motion/stagger";
import { asStringArray, asEmployers } from "@/lib/worker-fields";
import { cn } from "@/lib/utils";

export interface WorkerCvData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  specialties: (keyof typeof specialtyLabels)[];
  experienceYears: number | null;
  education: string | null;
  address: string | null;
  languages: unknown;
  courses: unknown;
  previousEmployers: unknown;
  licenses: unknown;
  ratingAverage: number | string;
  ratingCount: number;
}

// Tamaño carta (8.5"x11") a 96dpi — para que el PDF exportado se vea como un
// documento real en vez de una captura de pantalla con proporciones random.
const PAGE_WIDTH_PX = 816;
const PAGE_HEIGHT_PX = 1056;

function languageLabel(value: string): string {
  return (languageLabels as Record<string, string>)[value] ?? value;
}

export function WorkerCv({ worker }: { worker: WorkerCvData }) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const languages = asStringArray(worker.languages);
  const courses = asStringArray(worker.courses);
  const licenses = asStringArray(worker.licenses);
  const employers = asEmployers(worker.previousEmployers);
  const rating = Number(worker.ratingAverage);

  async function handleDownload() {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      // html2canvas-pro (no el html2canvas original): Tailwind 4 define sus
      // colores con oklch()/oklab(), y el html2canvas clásico no los sabe
      // parsear al leer los estilos computados — falla con "unsupported
      // color function". Este fork sí los soporta.
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      // useCORS: la foto de perfil se sirve desde ImageKit (otro origen) —
      // sin esto, html2canvas no puede leer sus píxeles para el canvas y la
      // omite en silencio (o falla al cargarla).
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const pageHeightPx = (canvas.width / PAGE_WIDTH_PX) * PAGE_HEIGHT_PX;
      const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width, pageHeightPx] });
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage([canvas.width, pageHeightPx]);
        const sliceHeight = Math.min(pageHeightPx, canvas.height - page * pageHeightPx);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceHeight;
        slice.getContext("2d")?.drawImage(
          canvas,
          0,
          page * pageHeightPx,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight,
        );
        pdf.addImage(slice.toDataURL("image/png"), "PNG", 0, 0, canvas.width, sliceHeight);
      }
      pdf.save(`CV-${worker.name.replace(/\s+/g, "_")}.pdf`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" className="gap-2" onClick={handleDownload} disabled={isExporting}>
          {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Descargar CV (PDF)
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <div
          ref={printRef}
          style={{ width: PAGE_WIDTH_PX, minHeight: PAGE_HEIGHT_PX }}
          className="mx-auto flex flex-col bg-white text-foreground"
        >
          {/* Header de marca — mismo violeta que el resto de la app (§3 CLAUDE.md) */}
          <div className="flex items-center gap-6 bg-primary px-10 py-8 text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Avatar className="size-28 border-4 border-white/30 shadow-lg">
                <AvatarImage src={worker.photoUrl ?? undefined} alt={worker.name} />
                <AvatarFallback className="bg-white/20 text-2xl text-white">
                  {worker.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <StaggerContainer className="flex min-w-0 flex-col gap-1.5">
              <StaggerItem>
                <h1 className="text-3xl font-bold tracking-tight">{worker.name}</h1>
              </StaggerItem>
              <StaggerItem>
                <p className="text-sm font-medium text-white/85">
                  {worker.specialties.map((s) => specialtyLabels[s]).join(" · ") || "Personal de eventos"}
                </p>
              </StaggerItem>
              <StaggerItem>
                <div className="mt-1 flex items-center gap-1.5">
                  <Star className="size-4 fill-amber-300 text-amber-300" />
                  <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
                  <span className="text-xs text-white/70">({worker.ratingCount} evaluaciones)</span>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>

          {/* Cuerpo — barra lateral de contacto/idiomas + columna principal de experiencia */}
          <div className="grid flex-1 grid-cols-[220px_1fr]">
            <aside className="flex flex-col gap-7 border-r border-border bg-secondary/40 px-6 py-8">
              <section className="flex flex-col gap-2.5">
                <h2 className="text-[11px] font-bold tracking-wider text-primary uppercase">Contacto</h2>
                <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                  <span className="flex items-start gap-2">
                    <Mail className="size-3.5 shrink-0 translate-y-0.5" />
                    <span className="break-all">{worker.email}</span>
                  </span>
                  {worker.phone ? (
                    <span className="flex items-center gap-2">
                      <Phone className="size-3.5 shrink-0" /> {worker.phone}
                    </span>
                  ) : null}
                  {worker.address ? (
                    <span className="flex items-start gap-2">
                      <MapPin className="size-3.5 shrink-0 translate-y-0.5" /> {worker.address}
                    </span>
                  ) : null}
                </div>
              </section>

              <section className="flex flex-col gap-2.5">
                <h2 className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-primary uppercase">
                  <Languages className="size-3.5" /> Idiomas
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {languages.map((lang) => (
                    <Badge key={lang} variant="secondary" className="font-normal">
                      {languageLabel(lang)}
                    </Badge>
                  ))}
                </div>
              </section>

              {licenses.length > 0 ? (
                <section className="flex flex-col gap-2.5">
                  <h2 className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-primary uppercase">
                    <BadgeCheck className="size-3.5" /> Licencias
                  </h2>
                  <div className="flex flex-col gap-1.5">
                    {licenses.map((license) => (
                      <div key={license} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                        {license}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </aside>

            <main className="flex flex-col gap-8 px-10 py-8">
              <section className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Briefcase className="size-4 text-primary" /> Experiencia
                </h2>
                <p className="-mt-1 text-xs text-muted-foreground">
                  {worker.experienceYears ?? 0} año(s) de experiencia en eventos
                </p>
                {employers.length > 0 ? (
                  <ul className="flex flex-col gap-4 border-l-2 border-border pl-4">
                    {employers.map((employer, i) => (
                      <li key={i} className="relative">
                        <span className="absolute top-1 -left-[1.32rem] size-2.5 rounded-full bg-primary" />
                        <p className="text-sm font-semibold text-foreground">{employer.role}</p>
                        <p className="text-xs text-muted-foreground">{employer.company}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-primary/80">
                          {employer.from} – {employer.to || "presente"}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>

              <section className={cn("flex flex-col gap-3", employers.length > 0 && "border-t border-border pt-6")}>
                <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <GraduationCap className="size-4 text-primary" /> Formación
                </h2>
                <p className="text-sm text-muted-foreground">{worker.education}</p>
                {courses.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {courses.map((course) => (
                      <Badge key={course} variant="outline">
                        {course}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </section>
            </main>
          </div>

          <div className="border-t border-border px-10 py-3 text-center text-[10px] text-muted-foreground">
            Generado con Opherix — plataforma de gestión de personal para eventos
          </div>
        </div>
      </div>
    </div>
  );
}
