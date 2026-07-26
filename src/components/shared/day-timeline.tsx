/**
 * OPHERIX — Plataforma SaaS de gestión de personal para eventos
 * © 2026 Cristhian Paul Prestán. Todos los derechos reservados.
 * Propiedad intelectual exclusiva del autor. Prohibida su reproducción,
 * distribución o uso no autorizado, total o parcial, sin consentimiento
 * expreso por escrito del autor.
 */

interface TimelineBlock {
  startAt: Date;
  endAt: Date;
  label?: string;
}

const HOUR_MARKS = [0, 6, 12, 18, 24];

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Agrupa cualquier lista con `{ event: { startAt } }` por día calendario,
 * ordenado cronológicamente — para dibujar una línea de tiempo por día. */
export function groupByDay<T extends { event: { startAt: Date } }>(items: T[]) {
  const groups = new Map<string, { day: Date; items: T[] }>();
  for (const item of items) {
    const key = dayKey(item.event.startAt);
    const group = groups.get(key);
    if (group) {
      group.items.push(item);
    } else {
      groups.set(key, { day: item.event.startAt, items: [item] });
    }
  }
  return Array.from(groups.values()).sort((a, b) => a.day.getTime() - b.day.getTime());
}

export { dayKey };

function minutesFromMidnight(date: Date, referenceDay: Date) {
  const sameDay = date.getDate() === referenceDay.getDate() && date.getMonth() === referenceDay.getMonth();
  if (!sameDay) return date > referenceDay ? 24 * 60 : 0;
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Línea de tiempo de un día (00:00–24:00) con los bloques ocupados marcados
 * en violeta — para que el administrador vea a simple vista, en horas
 * exactas (no en franjas Mañana/Tarde/Noche), qué tramos del día están
 * realmente libres antes de asignar otro evento el mismo día.
 */
export function DayTimeline({ day, blocks }: { day: Date; blocks: TimelineBlock[] }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="relative h-7 w-full overflow-hidden rounded-md bg-muted">
        {blocks.map((block, i) => {
          const startMin = minutesFromMidnight(block.startAt, day);
          const endMin = minutesFromMidnight(block.endAt, day);
          const left = (startMin / (24 * 60)) * 100;
          const width = Math.max(((endMin - startMin) / (24 * 60)) * 100, 1.5);
          return (
            <div
              key={i}
              title={block.label}
              className="absolute top-0 h-full bg-primary/80"
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        {HOUR_MARKS.map((h) => (
          <span key={h}>{String(h).padStart(2, "0")}:00</span>
        ))}
      </div>
    </div>
  );
}
