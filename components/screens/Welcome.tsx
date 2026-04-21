"use client";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/chrome/Container";
import { ResumeBanner } from "@/components/chrome/ResumeBanner";
import { LangSelector } from "@/components/chrome/LangSelector";
import { loadDraft, clearDraft } from "@/lib/draft";
import { useFormStore } from "@/lib/store";

export function Welcome() {
  const t = useTranslations("welcome");
  const locale = useLocale();
  const router = useRouter();
  const [draft, setDraft] = useState<ReturnType<typeof loadDraft>>(null);
  const hydrate = useFormStore((s) => s.hydrate);

  useEffect(() => {
    setDraft(loadDraft());
  }, []);

  const start = () => {
    clearDraft();
    useFormStore.getState().reset();
    router.push(`/${locale}/s1/1`);
  };

  const resume = () => {
    if (!draft) return;
    hydrate(draft.answers as Parameters<typeof hydrate>[0]);
    router.push(draft.route);
  };

  return (
    <>
      <LangSelector />
      <Container variant="wizard">
        {draft && <ResumeBanner onContinue={resume} onRestart={start} />}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="text-center text-[11px] tracking-widest text-white/60 mb-4">
            {t("brand")}
          </div>
          <h1 className="text-[30px] md:text-[34px] font-bold leading-[1.1] tracking-tight gradient-text text-center mb-4">
            {t("title")}
          </h1>
          <p className="text-sm text-white/70 leading-relaxed mb-3">{t("intro1")}</p>
          <p className="text-sm text-white/70 leading-relaxed mb-3">{t("intro2")}</p>
          <p className="text-sm text-white/70 leading-relaxed mb-4">{t("intro3")}</p>

          <div
            className="rounded-xl px-3.5 py-3 text-[13px] leading-snug mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(236,72,153,0.1))",
              border: "1px solid rgba(167,139,250,0.3)",
            }}
          >
            {t("gift")}
          </div>

          <button
            onClick={start}
            className="block w-full py-3.5 rounded-full bg-accent-gradient text-white font-semibold text-sm"
          >
            {t("cta")} →
          </button>

          <p className="text-[10px] text-white/45 text-center mt-3.5">
            {t("privacyNotice")}{" "}
            <a href={`/${locale}/privacy`} className="underline">
              {t("privacyLink")}
            </a>
            .
          </p>
        </motion.div>
      </Container>
    </>
  );
}
