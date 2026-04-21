"use client";
import { motion } from "framer-motion";
import clsx from "clsx";

export function Pill({
  children,
  selected = false,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  variant?: "default" | "small";
}) {
  const base = variant === "small"
    ? "px-3 py-2.5 text-xs"
    : "px-4 py-3.5 text-sm";
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={clsx(
        "w-full text-left rounded-xl border transition-colors",
        base,
        selected
          ? "bg-accent-gradient border-transparent text-white font-medium"
          : "bg-raised border-[rgba(255,255,255,0.12)] text-white hover:bg-raised-selected"
      )}
    >
      {children}
    </motion.button>
  );
}
