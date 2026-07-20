/**
 * OPERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface EventTypeSlice {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export function EventTypeDonutChart({ data }: { data: EventTypeSlice[] }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ResponsiveContainer width="100%" height={180} className="sm:max-w-[180px]">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
            {data.map((slice) => (
              <Cell key={slice.name} fill={slice.color} stroke="#ffffff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
            formatter={(value, name) => [`${value}`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Leyenda textual: swatch + nombre + porcentaje — la identidad nunca depende solo del color */}
      <ul className="flex flex-1 flex-col gap-2">
        {data.map((slice) => (
          <li key={slice.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-foreground">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              {slice.name}
            </span>
            <span className="font-medium text-muted-foreground">{slice.percentage}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
