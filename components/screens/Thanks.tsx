"use client";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/chrome/Container";
import { LangSelector } from "@/components/chrome/LangSelector";
import { clearDraft } from "@/lib/draft";
import { useFormStore } from "@/lib/store";

export function Thanks() {
  const t = useTranslations("thanks");
  const locale = useLocale();
  const reset = useFormStore((s) => s.reset);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    clearDraft();
    reset();
  }, [reset]);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/${locale}` : "";
  const shareText = locale === "es"
    ? `Ayudame con esta encuesta para creadores (3 min): ${shareUrl}`
    : `Help with this creator survey (3 min): ${shareUrl}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <LangSelector />
      <Container variant="wizard">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-5xl text-center my-4">🎉</div>
          <h1 className="text-[26px] font-bold text-center mb-3">{t("title")}</h1>
          <p className="text-[14px] text-white/75 text-center leading-relaxed mb-4">{t("body")}</p>
          <div
            className="rounded-xl px-3.5 py-3 text-[13px] leading-snug mb-4"
            style={{ background: "rgba(255,200,100,0.05)", border: "1px solid rgba(255,200,100,0.25)" }}
          >
            {t("gift")}
          </div>
          <p className="text-[13px] text-white/65 text-center mb-4">{t("closingLine")}</p>

          <div className="border-t border-white/8 pt-4">
            <p className="text-[12px] text-white/60 text-center mb-3">{t("shareTitle")}</p>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-whatsapp-green text-white font-semibold text-[13px]"
            >
              {t("shareWhatsapp")}
            </a>
            <button
              onClick={copyLink}
              className="mt-2 flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-white/6 border border-white/15 text-[13px]"
            >
              {copied ? t("shareCopied") : t("shareCopy")}
            </button>
          </div>
        </motion.div>
      </Container>
    </>
  );
}
