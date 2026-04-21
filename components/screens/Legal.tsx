"use client";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Container } from "@/components/chrome/Container";
import { LangSelector } from "@/components/chrome/LangSelector";

export function Legal() {
  const t = useTranslations("legal");
  const locale = useLocale();
  const router = useRouter();
  const email = t("contactEmail");

  const onBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/${locale}`);
    }
  };

  return (
    <>
      <LangSelector />
      <Container variant="scroll">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        >
          <button
            type="button"
            onClick={onBack}
            className="text-[12px] text-white/60 hover:text-white transition-colors"
          >
            {t("back")}
          </button>

          <header className="mt-6">
            <h1 className="text-[28px] md:text-[32px] font-bold leading-tight gradient-text">
              {t("title")}
            </h1>
            <p className="mt-1 text-[11px] text-white/45">{t("updated")}</p>
          </header>

          <section className="mt-8 space-y-3">
            <h2 className="text-[15px] font-semibold text-white/90">
              {t("terms.heading")}
            </h2>
            <p className="text-[13px] leading-relaxed text-white/70">{t("terms.p1")}</p>
            <p className="text-[13px] leading-relaxed text-white/70">{t("terms.p2")}</p>
            <p className="text-[13px] leading-relaxed text-white/70">{t("terms.p3")}</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-[15px] font-semibold text-white/90">
              {t("privacy.heading")}
            </h2>
            <p className="text-[13px] leading-relaxed text-white/70">{t("privacy.p1")}</p>
            <p className="text-[13px] leading-relaxed text-white/70">{t("privacy.p2")}</p>
            <p className="text-[13px] leading-relaxed text-white/70">{t("privacy.p3")}</p>
            <p className="text-[13px] leading-relaxed text-white/70">{t("privacy.p4")}</p>
            <p className="text-[13px] leading-relaxed text-white/70">{t("privacy.p5")}</p>
          </section>

          <p className="mt-8 text-[13px] text-white/70">
            {t("contactLine")}
            <a href={`mailto:${email}`} className="underline hover:text-white">
              {email}
            </a>
          </p>
        </motion.div>
      </Container>
    </>
  );
}
