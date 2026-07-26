/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

import QRCode from "qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateCheckInCode } from "@/lib/checkin-code";

export async function EventCheckInCode({ eventId }: { eventId: string }) {
  const code = generateCheckInCode(eventId);
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const deepLink = `${baseUrl}/trabajador/check-in?event=${eventId}&code=${code}`;
  const qrDataUrl = await QRCode.toDataURL(deepLink, { margin: 1, width: 180 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Código de check-in de hoy</CardTitle>
        <CardDescription>
          Muestra este QR en el evento o dicta el código al personal para que confirme su asistencia.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="Código QR de check-in" className="size-32 rounded-md border border-border" />
        <p className="text-2xl font-semibold tracking-widest">{code}</p>
      </CardContent>
    </Card>
  );
}
