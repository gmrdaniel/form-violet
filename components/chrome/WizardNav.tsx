"use client";
import { useTranslations } from "next-intl";
import clsx from "clsx";

export function WizardNav({
  onBack,
  onNext,
  canGoBack = true,
  canAdvance = true,
  nextLabel,
}: {
  onBack?: () => void;
  onNext: () => void;
  canGoBack?: boolean;
  canAdvance?: boolean;
  nextLabel?: string;
}) {
  const t = useTranslations("nav");
  return (
    <div className="flex justify-between mt-8 text-sm">
      {canGoBack ? (
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          {t("back")}
        </button>
      ) : <div />}
      <button
        type="button"
        onClick={onNext}
        disabled={!canAdvance}
        className={clsx(
          "px-5 py-2.5 rounded-full font-semibold transition-opacity",
          canAdvance
            ? "bg-white text-black hover:opacity-90"
            : "bg-white/20 text-white/50 cursor-not-allowed"
        )}
      >
        {nextLabel || t("next")}
      </button>
    </div>
  );
}
