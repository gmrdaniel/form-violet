"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function ProgressBar({
  section,
  percent,
  minsLeft,
  isLastQuestion = false,
}: {
  section: 1 | 2 | 3 | 4;
  percent: number;
  minsLeft: number;
  isLastQuestion?: boolean;
}) {
  const t = useTranslations("progress");
  return (
    <div className="mb-7">
      <div className="h-[3px] bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden mb-1.5">
        <motion.div
          className="h-full bg-accent-gradient"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-white/55">
        <span>{t("sectionOf", { current: section, total: 4 })}</span>
        <span>{isLastQuestion ? t("lastQuestion") : t("minsLeft", { mins: minsLeft })}</span>
      </div>
    </div>
  );
}
