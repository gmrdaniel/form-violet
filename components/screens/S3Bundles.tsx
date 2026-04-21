"use client";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Container } from "@/components/chrome/Container";
import { ProgressBar } from "@/components/chrome/ProgressBar";
import { LangSelector } from "@/components/chrome/LangSelector";
import { BundleCard } from "@/components/bundle/BundleCard";
import { Pill } from "@/components/fields/Pill";
import { BUNDLES } from "@/lib/bundles";
import { BUNDLE_PREFERENCE } from "@/lib/schema";
import { useFormStore } from "@/lib/store";

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
          <p className="text-[13px] text-white/60 mb-5">{t("s3.intro")}</p>

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
