"use client";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export function ResumeBanner({
  onContinue,
  onRestart,
}: {
  onContinue: () => void;
  onRestart: () => void;
}) {
  const t = useTranslations("welcome");
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 p-3.5 rounded-xl flex justify-between items-center gap-3 text-sm"
      style={{
        background: "linear-gradient(90deg, rgba(167,139,250,0.12), rgba(236,72,153,0.08))",
        border: "1px solid rgba(167,139,250,0.25)",
      }}
    >
      <span className="flex-1">{t("resumeTitle")}</span>
      <div className="flex gap-2">
        <button
          onClick={onRestart}
          className="text-[11px] px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20"
        >
          {t("resumeRestart")}
        </button>
        <button
          onClick={onContinue}
          className="text-[11px] px-2.5 py-1.5 rounded-full bg-white text-black font-semibold"
        >
          {t("resumeContinue")}
        </button>
      </div>
    </motion.div>
  );
}
