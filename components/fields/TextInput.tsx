"use client";
import clsx from "clsx";

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  autoFocus = false,
  onEnter,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel";
  error?: string | null;
  autoFocus?: boolean;
  onEnter?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) { e.preventDefault(); onEnter(); }
        }}
        aria-invalid={!!error}
        className={clsx(
          "w-full px-4 py-3.5 text-sm rounded-xl bg-raised border transition-colors focus:outline-none",
          error
            ? "border-error focus:border-error"
            : "border-[rgba(255,255,255,0.12)] focus:border-white/40"
        )}
      />
      {error && <p className="text-[12px] text-error">{error}</p>}
    </div>
  );
}
