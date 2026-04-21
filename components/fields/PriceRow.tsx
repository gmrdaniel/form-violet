"use client";
import { useState } from "react";

export function PriceRow({
  prices,
  value,
  onChange,
}: {
  prices: readonly [number, number, number];
  value: number | null;
  onChange: (v: number | null, isCustom: boolean) => void;
}) {
  const [custom, setCustom] = useState<string>("");
  const isPreset = value !== null && (prices as readonly number[]).includes(value);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        {prices.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => { setCustom(""); onChange(p, false); }}
            className={`py-2.5 rounded-[10px] text-sm font-semibold transition-colors ${
              value === p
                ? "bg-accent-gradient text-white"
                : "bg-raised border border-[rgba(255,255,255,0.12)]"
            }`}
          >
            ${p}
          </button>
        ))}
      </div>
      <input
        type="number"
        inputMode="decimal"
        value={custom}
        placeholder="Otro monto"
        onChange={(e) => {
          setCustom(e.target.value);
          const n = parseInt(e.target.value, 10);
          onChange(Number.isFinite(n) && n > 0 ? n : null, true);
        }}
        className={`w-full px-3 py-2.5 text-sm rounded-[10px] bg-raised border text-center transition-colors ${
          value !== null && !isPreset
            ? "border-violet"
            : "border-dashed border-[rgba(255,255,255,0.2)]"
        } focus:outline-none focus:border-violet`}
      />
    </div>
  );
}
