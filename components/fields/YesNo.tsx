"use client";
import { motion } from "framer-motion";
import clsx from "clsx";

export function YesNo({
  value,
  onChange,
  yesLabel,
  noLabel,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <div className="flex gap-2">
      {[
        { v: true, label: yesLabel },
        { v: false, label: noLabel },
      ].map((opt) => (
        <motion.button
          key={String(opt.v)}
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(opt.v)}
          className={clsx(
            "flex-1 py-4 rounded-xl border text-sm font-semibold transition-colors",
            value === opt.v
              ? "bg-accent-gradient border-transparent text-white"
              : "bg-raised border-[rgba(255,255,255,0.15)]"
          )}
        >
          {opt.label}
        </motion.button>
      ))}
    </div>
  );
}
