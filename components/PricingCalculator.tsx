"use client";

import { useState } from "react";

const PRICE = 400_000;
const MIN = 1;
const MAX = 60;
const PRESETS = [5, 10, 20, 40];

const fcfa = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)).replace(/ | /g, " ");

export default function PricingCalculator() {
  const [count, setCount] = useState(20);
  const total = count * PRICE;
  const pct = ((count - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="surface p-6 sm:p-8">
      <p className="eyebrow">Simulateur de contrat</p>
      <div className="mt-6 flex items-end justify-between gap-4">
        <label htmlFor="headsets" className="text-sm text-mist">
          Nombre de casques
        </label>
        <output htmlFor="headsets" className="font-display text-[2.25rem] font-semibold leading-none tracking-tight tabular-nums">
          {count}
        </output>
      </div>
      <input
        id="headsets"
        type="range"
        min={MIN}
        max={MAX}
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
        className="mt-5 w-full"
        style={{ ["--p" as string]: `${pct}%` }}
        aria-valuetext={`${count} casques`}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setCount(p)}
            aria-pressed={count === p}
            className={`h-8 rounded-full px-3.5 text-[13px] font-medium transition-colors duration-200 active:scale-[0.97] ${
              count === p ? "bg-fg text-ink" : "bg-tint/[0.06] text-mist hover:bg-tint/10 hover:text-fg"
            }`}
          >
            {p} casques
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
        <div>
          <p className="text-sm text-mist">Valeur annuelle du contrat</p>
          <p className="mt-1 font-display text-[1.75rem] font-semibold tracking-tight tabular-nums">
            {fcfa(total)}
            <span className="ml-1.5 text-base font-medium text-mist">FCFA</span>
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-sm text-mist">Soit par mois</p>
          <p className="mt-1 font-display text-[1.75rem] font-semibold tracking-tight tabular-nums text-fg/70">
            {fcfa(total / 12)} <span className="text-sm text-mist">FCFA</span>
          </p>
        </div>
      </div>
      <p className="mt-5 text-[13px] leading-relaxed text-mist">
        Casques, plateforme et expériences inclus. Commencez avec quelques appareils, puis équipez des classes entières.
      </p>
    </div>
  );
}
