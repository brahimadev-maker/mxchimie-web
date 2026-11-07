"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export const nf = new Intl.NumberFormat("fr-FR");
const dayFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const dayLongFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export type Jour = { jour: string; visiteurs: number; pages_vues: number; demandes: number };

function niceStep(x: number) {
  if (x <= 1) return 1;
  const p = 10 ** Math.floor(Math.log10(x));
  const n = x / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Courbe des visiteurs par jour, avec repère vertical et infobulle. */
export function VisitorsChart({ data }: { data: Jour[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const H = 240;
  const pad = { l: 36, r: 12, t: 14, b: 28 };
  const w = Math.max(0, width - pad.l - pad.r);
  const h = H - pad.t - pad.b;
  const max = Math.max(0, ...data.map((d) => d.visiteurs));
  const step = niceStep(Math.max(max, 4) / 4);
  const top = Math.max(step * 4, Math.ceil(max / step) * step);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const n = data.length;
  const x = (i: number) => pad.l + (n <= 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v: number) => pad.t + h - (v / top) * h;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.visiteurs).toFixed(1)}`).join("");
  const area = n ? `${line}L${x(n - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z` : "";
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / 72))));

  function onMove(e: PointerEvent<SVGSVGElement>) {
    if (!n) return;
    const r = e.currentTarget.getBoundingClientRect();
    const i = n <= 1 ? 0 : Math.round(((e.clientX - r.left - pad.l) / w) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  }
  function onKey(e: KeyboardEvent<SVGSVGElement>) {
    if (!n) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const d = e.key === "ArrowRight" ? 1 : -1;
      setHover((v) => Math.max(0, Math.min(n - 1, (v ?? (d > 0 ? -1 : n)) + d)));
    }
  }

  const cur = hover != null ? data[hover] : null;
  const tipLeft = hover != null ? Math.min(Math.max(x(hover) + 12, 0), Math.max(0, width - 180)) : 0;

  return (
    <div>
      <div ref={ref} className="relative" style={{ height: H }}>
        {width > 0 && (
          <svg
            width={width}
            height={H}
            className="block touch-pan-y outline-none"
            role="img"
            aria-label={`Visiteurs par jour, ${n} jours, maximum ${nf.format(max)}. Flèches gauche et droite pour parcourir les jours.`}
            tabIndex={0}
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
            onKeyDown={onKey}
            onBlur={() => setHover(null)}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={pad.l + w} y1={y(t)} y2={y(t)} stroke="rgb(var(--tint) / 0.08)" strokeWidth="1" />
                <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-mist text-[11px] tabular-nums">
                  {nf.format(t)}
                </text>
              </g>
            ))}
            {data.map((d, i) =>
              i % labelEvery === 0 || i === n - 1 ? (
                <text key={d.jour} x={x(i)} y={H - 8} textAnchor={i === 0 && n > 1 ? "start" : i === n - 1 && n > 1 ? "end" : "middle"} className="fill-mist text-[11px]">
                  {dayFmt.format(new Date(d.jour))}
                </text>
              ) : null,
            )}
            <path d={area} fill="var(--link)" fillOpacity="0.1" />
            <path d={line} fill="none" stroke="var(--link)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {cur && hover != null && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + h} stroke="rgb(var(--tint) / 0.25)" strokeWidth="1" />
                <circle cx={x(hover)} cy={y(cur.visiteurs)} r="4.5" fill="var(--link)" stroke="var(--panel)" strokeWidth="2" />
              </g>
            )}
          </svg>
        )}
        {cur && (
          <div
            className="pointer-events-none absolute top-2 z-10 w-[168px] rounded-xl border border-line bg-panel px-3 py-2.5 text-[13px] shadow-lg"
            style={{ left: tipLeft }}
            role="status"
          >
            <p className="mb-1.5 text-[12px] text-mist first-letter:uppercase">{dayLongFmt.format(new Date(cur.jour))}</p>
            <TipRow value={cur.visiteurs} label="Visiteurs" keyed />
            <TipRow value={cur.pages_vues} label="Pages vues" />
            <TipRow value={cur.demandes} label="Demandes" />
          </div>
        )}
      </div>
      <details className="mt-3 text-[13px]">
        <summary className="cursor-pointer text-mist hover:text-fg">Voir les données jour par jour</summary>
        <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-line">
          <table className="w-full text-left tabular-nums">
            <thead className="sticky top-0 bg-panel text-mist">
              <tr>
                <th className="px-3 py-2 font-medium">Jour</th>
                <th className="px-3 py-2 text-right font-medium">Visiteurs</th>
                <th className="px-3 py-2 text-right font-medium">Pages vues</th>
                <th className="px-3 py-2 text-right font-medium">Demandes</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.jour} className="border-t border-line">
                  <td className="px-3 py-1.5">{dayFmt.format(new Date(d.jour))}</td>
                  <td className="px-3 py-1.5 text-right">{nf.format(d.visiteurs)}</td>
                  <td className="px-3 py-1.5 text-right">{nf.format(d.pages_vues)}</td>
                  <td className="px-3 py-1.5 text-right">{nf.format(d.demandes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function TipRow({ value, label, keyed }: { value: number; label: string; keyed?: boolean }) {
  return (
    <p className="flex items-center gap-2 leading-6">
      <span className={`h-0.5 w-3 rounded-full ${keyed ? "bg-[var(--link)]" : "bg-transparent"}`} aria-hidden="true" />
      <span className="font-semibold tabular-nums text-fg">{nf.format(value)}</span>
      <span className="text-mist">{label}</span>
    </p>
  );
}

/** Liste de barres horizontales : nom, valeur à droite, barre fine dessous. */
export function BarList({ rows, unit, empty = "Pas encore de données sur cette période." }: { rows: { nom: string; valeur: number; note?: string }[]; unit: string; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.valeur));
  if (!rows.length || rows.every((r) => r.valeur === 0)) return <p className="py-6 text-[14px] text-mist">{empty}</p>;
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => (
        <li key={r.nom} title={`${r.nom} : ${nf.format(r.valeur)} ${unit}`}>
          <div className="flex items-baseline justify-between gap-4 text-[14px]">
            <span className="min-w-0 truncate text-fg/90">{r.nom}</span>
            <span className="shrink-0 tabular-nums">
              <span className="font-semibold">{nf.format(r.valeur)}</span>
              {r.note && <span className="ml-1.5 text-[12px] text-mist">{r.note}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-tint/[0.06]">
            <div className="h-2 rounded-full bg-[var(--link)]" style={{ width: `${(r.valeur / max) * 100}%`, minWidth: r.valeur ? 4 : 0 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
