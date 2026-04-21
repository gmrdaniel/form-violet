"use client";
import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

export function LangSelector() {
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "es" ? "en" : "es";
  const newPath = pathname.replace(/^\/(es|en)/, `/${other}`);
  return (
    <Link
      href={newPath}
      className="fixed top-5 right-5 text-[11px] tracking-widest text-white/55 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:text-white transition-colors"
    >
      🌐 {locale.toUpperCase()} · {other.toUpperCase()}
    </Link>
  );
}
