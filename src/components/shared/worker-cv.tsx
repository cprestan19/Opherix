/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Mail, Phone, Star, MapPin, Languages, GraduationCap, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { specialtyLabels } from "@/lib/validations/worker-application";
import { StaggerContainer, StaggerItem } from "@/components/shared/motion/stagger";

interface Employer {
  company: string;
  role: string;
  from: string;
  to?: string;
}

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

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function asEmployers(value: unknown): Employer[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is Employer => typeof v === "object" && v !== null && "company" in v && "role" in v,
  );
}

export function WorkerCv({ worker }: { worker: WorkerCvData }) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const languages = asStringArray(worker.languages);
  const courses = asStringArray(worker.courses);
  const licenses = asStringArray(worker.licenses);
  const employers = asEmployers(worker.previousEmployers);

  async function handleDownload() {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
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

      <Card>
        <CardContent className="p-0">
          <div ref={printRef} className="flex flex-col gap-6 bg-white p-8">
            <div className="flex items-center gap-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Avatar className="size-24 border border-border">
                  <AvatarImage src={worker.photoUrl ?? undefined} alt={worker.name} />
                  <AvatarFallback className="text-lg">{worker.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </motion.div>
              <StaggerContainer className="flex flex-col gap-1">
                <StaggerItem>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">{worker.name}</h2>
                </StaggerItem>
                <StaggerItem>
                  <div className="flex flex-wrap gap-1.5">
                    {worker.specialties.map((specialty) => (
                      <Badge key={specialty} className="w-fit">
                        {specialtyLabels[specialty]}
                      </Badge>
                    ))}
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="size-3.5" /> {worker.email}
                    </span>
                    {worker.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone className="size-3.5" /> {worker.phone}
                      </span>
                    ) : null}
                    {worker.address ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" /> {worker.address}
                      </span>
                    ) : null}
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="mt-1 flex items-center gap-1 text-sm">
                    <Star className="size-4 fill-warning text-warning" />
                    <span className="font-medium">{Number(worker.ratingAverage).toFixed(1)}</span>
                    <span className="text-muted-foreground">({worker.ratingCount} evaluaciones)</span>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </div>

            <Separator />

            <StaggerContainer className="grid gap-6 sm:grid-cols-2">
              <StaggerItem className="flex flex-col gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Briefcase className="size-4" /> Experiencia
                </h3>
                <p className="text-sm text-muted-foreground">
                  {worker.experienceYears ?? 0} años de experiencia en eventos
                </p>
                <ul className="flex flex-col gap-2">
                  {employers.map((employer, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium text-foreground">{employer.role}</span>
                      <span className="text-muted-foreground"> — {employer.company}</span>
                      <div className="text-xs text-muted-foreground">
                        {employer.from} – {employer.to || "presente"}
                      </div>
                    </li>
                  ))}
                </ul>
              </StaggerItem>

              <StaggerItem className="flex flex-col gap-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <GraduationCap className="size-4" /> Formación
                  </h3>
                  <p className="text-sm text-muted-foreground">{worker.education}</p>
                  {courses.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {courses.map((course) => (
                        <Badge key={course} variant="outline">
                          {course}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Languages className="size-4" /> Idiomas
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {languages.map((lang) => (
                      <Badge key={lang} variant="secondary">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
                {licenses.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Licencias y certificaciones</h3>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {licenses.map((license) => (
                        <Badge key={license} variant="outline">
                          {license}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </StaggerItem>
            </StaggerContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
