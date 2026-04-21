"use client";
import clsx from "clsx";

export function TextArea({
  value,
  onChange,
  placeholder,
  maxLength = 500,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={4}
        aria-invalid={!!error}
        className={clsx(
          "w-full px-4 py-3 text-sm rounded-xl bg-raised border transition-colors focus:outline-none resize-none",
          error ? "border-error" : "border-[rgba(255,255,255,0.12)] focus:border-white/40"
        )}
      />
      <div className="flex justify-between text-[11px]">
        <span className="text-error">{error || ""}</span>
        <span className="text-white/40">{value.length} / {maxLength}</span>
      </div>
    </div>
  );
}
