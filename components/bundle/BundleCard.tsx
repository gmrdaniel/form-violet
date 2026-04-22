"use client";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { PriceRow } from "@/components/fields/PriceRow";
import { useFormStore } from "@/lib/store";
import type { BundleConfig } from "@/lib/bundles";

export function BundleCard({ bundle }: { bundle: BundleConfig }) {
  const t = useTranslations();
  const storeKey = `bundle_${bundle.id}_price` as "bundle_starter_price" | "bundle_growth_price" | "bundle_pro_price";
  const value = useFormStore((s) => s[storeKey] ?? null);
  const setField = useFormStore((s) => s.set);

  return (
    <div
      className={clsx(
        "rounded-2xl border p-3.5 mb-2.5",
        bundle.isHighlighted
          ? "border-[rgba(167,139,250,0.3)]"
          : "border-border-subtle"
      )}
      style={
        bundle.isHighlighted
          ? { background: "linear-gradient(180deg, rgba(167,139,250,0.08), rgba(167,139,250,0.02))" }
          : { background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))" }
      }
    >
      <div className="inline-block text-[10px] tracking-widest px-2 py-0.5 rounded-full bg-white/8 mb-1.5">
        {t(bundle.tagKey)}
      </div>
      <div className="text-[15px] font-bold mb-1.5">{t(bundle.nameKey)}</div>
      <div className="text-[12px] text-white/70 leading-snug mb-2.5">{t(bundle.includesKey)}</div>
      <div className="flex justify-between text-[11px] mt-2 pt-2 border-t border-white/8">
        <span className="text-white/45 line-through">{t(`bundles.${bundle.id}.value`)}</span>
        <span className="text-success font-semibold">{t(`bundles.${bundle.id}.savings`)}</span>
      </div>

      <div className="text-[13px] font-medium mt-3.5 mb-2">{t("s3.priceQuestion")}</div>
      <PriceRow
        prices={bundle.prices}
        value={value as number | null}
        onChange={(v) => setField(storeKey, v)}
      />
      <button
        onClick={() => setField(storeKey, null)}
        className="block w-full text-[11px] text-white/50 underline mt-2 py-1"
      >
        {t("s3.notInterestedBundle")}
      </button>
    </div>
  );
}
