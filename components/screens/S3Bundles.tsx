"use client";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Container } from "@/components/chrome/Container";
import { ProgressBar } from "@/components/chrome/ProgressBar";
import { LangSelector } from "@/components/chrome/LangSelector";
import { BundleCard } from "@/components/bundle/BundleCard";
import { Pill } from "@/components/fields/Pill";
import { BUNDLES } from "@/lib/bundles";
import { BUNDLE_PREFERENCE } from "@/lib/schema";
import { useFormStore } from "@/lib/store";

const BUNDLE_ICONS: Record<"starter" | "growth" | "pro", string> = {
  starter: "💎",
  growth: "⚡",
  pro: "🚀",
};

export function S3Bundles() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pref = useFormStore((s) => s.bundle_preference);
  const setField = useFormStore((s) => s.set);

  return (
    <>
      <LangSelector />
      <Container variant="scroll">
        <ProgressBar section={3} percent={70} minsLeft={1} />
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-[18px] font-semibold mb-1">{t("s3.sectionTitle")}</h2>
          <p className="text-[13px] text-white/60 mb-4">{t("s3.intro")}</p>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {BUNDLES.map((b) => (
              <div
                key={b.id}
                className={clsx(
                  "rounded-xl border p-2.5 flex flex-col",
                  b.isHighlighted
                    ? "border-[rgba(167,139,250,0.4)] bg-[rgba(167,139,250,0.06)]"
                    : "border-white/10 bg-white/3"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="text-base leading-none">
                    {BUNDLE_ICONS[b.id]}
                  </span>
                  <span className="text-[10px] tracking-widest font-bold text-white/85">
                    {t(b.tagKey)}
                  </span>
                  {b.isHighlighted && (
                    <span className="ml-auto text-[8px] tracking-widest font-bold text-[rgba(167,139,250,0.95)]">
                      {t("s3.popular")}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-white/70 flex-1">
                  {t(`bundles.${b.id}.tagItems`)}
                </p>
                <div className="mt-2 pt-2 border-t border-white/8">
                  <div className="text-[11px] text-white/55">
                    {t(`bundles.${b.id}.value`)}
                  </div>
                  <div className="text-[10px] font-semibold text-orange-400 mt-0.5">
                    🔥 {t(`bundles.${b.id}.savings`)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {BUNDLES.map((b) => <BundleCard key={b.id} bundle={b} />)}

          <div className="mt-6 pt-5 border-t border-white/8">
            <h3 className="text-[14px] font-medium mb-3">{t("s3.q8.text")}</h3>
            <div className="space-y-2">
              {BUNDLE_PREFERENCE.map((v) => (
                <Pill
                  key={v}
                  selected={pref === v}
                  onClick={() => setField("bundle_preference", v)}
                >
                  {t(`s3.q8.${v}`)}
                </Pill>
              ))}
            </div>
          </div>

          <button
            onClick={() => router.push(`/${locale}/s4/9`)}
            disabled={!pref}
            className={`mt-5 block w-full py-3.5 rounded-full font-semibold text-sm ${
              pref ? "bg-white text-black" : "bg-white/20 text-white/50 cursor-not-allowed"
            }`}
          >
            {t("nav.next")}
          </button>
        </motion.div>
      </Container>
    </>
  );
}
