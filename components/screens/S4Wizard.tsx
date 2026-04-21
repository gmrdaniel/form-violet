"use client";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Container } from "@/components/chrome/Container";
import { ProgressBar } from "@/components/chrome/ProgressBar";
import { LangSelector } from "@/components/chrome/LangSelector";
import { WizardNav } from "@/components/chrome/WizardNav";
import { Pill } from "@/components/fields/Pill";
import { TextInput } from "@/components/fields/TextInput";
import { TextArea } from "@/components/fields/TextArea";
import { YesNo } from "@/components/fields/YesNo";
import { BUDGET_RANGES } from "@/lib/schema";
import { useFormStore } from "@/lib/store";

export function S4Wizard({ qId }: { qId: 9 | 10 | 11 }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const store = useFormStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const percent = qId === 9 ? 82 : qId === 10 ? 92 : 98;

  const goBack = () => {
    if (qId === 9) router.push(`/${locale}/s3`);
    else router.push(`/${locale}/s4/${qId - 1}`);
  };

  const goNext = () => {
    if (qId === 9) router.push(`/${locale}/s4/10`);
    else if (qId === 10) router.push(`/${locale}/s4/11`);
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...store,
          locale,
          services: Object.values(store.services).map((s) => ({
            serviceId: s.serviceId,
            interest: s.interest ?? "none",
            priceMonthly: s.priceMonthly ?? null,
            priceSetup: s.priceSetup ?? null,
          })),
          hp_website: "",
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 429) setError(t("errors.submitRateLimit"));
        else setError(body.error || t("errors.submitServer"));
        setSubmitting(false);
        return;
      }
      router.push(`/${locale}/thanks`);
    } catch {
      setError(t("errors.submitNetwork"));
      setSubmitting(false);
    }
  };

  return (
    <>
      <LangSelector />
      <Container variant="wizard">
        <ProgressBar section={4} percent={percent} minsLeft={0} isLastQuestion={qId === 11} />
        <AnimatePresence mode="wait">
          <motion.div
            key={qId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <p className="text-[11px] tracking-wider text-white/45 mb-2">PREGUNTA {qId} / 11</p>

            {qId === 9 && <Q9 t={t} store={store} />}
            {qId === 10 && <Q10 t={t} store={store} />}
            {qId === 11 && (
              <Q11 t={t} store={store} submitting={submitting} error={error} onSubmit={submit} />
            )}

            {qId !== 11 && (
              <WizardNav
                onBack={goBack}
                onNext={goNext}
                canAdvance={canAdvance(qId, store)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Container>
    </>
  );
}

function canAdvance(qId: number, s: ReturnType<typeof useFormStore.getState>): boolean {
  if (qId === 9) {
    if (!s.budget_range) return false;
    if (s.budget_range === "custom") return !!s.budget_custom && s.budget_custom > 0;
    return true;
  }
  if (qId === 10) return !!s.one_wish && s.one_wish.trim().length >= 3;
  return true;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function Q9({ t, store }: any) {
  return (
    <>
      <h2 className="text-[22px] font-semibold leading-tight mb-2">{t("s4.q9.text")}</h2>
      <p className="text-[12px] text-white/55 mb-4">{t("s4.q9.hint")}</p>
      <div className="space-y-2">
        {BUDGET_RANGES.filter((r) => r !== "custom").map((r) => (
          <Pill key={r} selected={store.budget_range === r} onClick={() => store.set("budget_range", r)}>
            {t(`s4.q9.${r}`)}
          </Pill>
        ))}
        <Pill
          selected={store.budget_range === "custom"}
          onClick={() => store.set("budget_range", "custom")}
        >
          {t("s4.q9.custom")}
        </Pill>
        {store.budget_range === "custom" && (
          <TextInput
            type="text"
            value={store.budget_custom?.toString() || ""}
            onChange={(v: string) => {
              const n = parseInt(v, 10);
              store.set("budget_custom", Number.isFinite(n) && n > 0 ? n : null);
            }}
            placeholder={t("s4.q9.customPlaceholder")}
          />
        )}
      </div>
    </>
  );
}

function Q10({ t, store }: any) {
  return (
    <>
      <h2 className="text-[20px] font-semibold leading-tight mb-4">{t("s4.q10.text")}</h2>
      <TextArea
        value={store.one_wish || ""}
        onChange={(v: string) => store.set("one_wish", v)}
        placeholder={t("s4.q10.placeholder")}
        maxLength={500}
      />
    </>
  );
}

function Q11({ t, store, submitting, error, onSubmit }: any) {
  const consent = store.contact_consent;
  const canSubmit =
    consent === false ||
    (consent === true && !!store.contact_phone && store.contact_phone.replace(/\D/g, "").length >= 8);

  return (
    <>
      <h2 className="text-[20px] font-semibold leading-tight mb-4">{t("s4.q11.text")}</h2>
      <YesNo
        value={consent ?? null}
        onChange={(v) => store.set("contact_consent", v)}
        yesLabel={t("s4.q11.yes")}
        noLabel={t("s4.q11.no")}
      />

      <AnimatePresence>
        {consent === true && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mt-4 pt-4 border-t border-white/8"
          >
            <label className="text-[11px] text-white/55 block mb-1.5">{t("s4.q11.phoneLabel")}</label>
            <TextInput
              type="tel"
              value={store.contact_phone || ""}
              onChange={(v: string) => store.set("contact_phone", v)}
              placeholder={t("s4.q11.phonePlaceholder")}
            />
            <label className="text-[11px] text-white/55 block mt-3 mb-1.5">{t("s4.q11.emailLabel")}</label>
            <TextInput
              type="email"
              value={store.contact_email || ""}
              onChange={(v: string) => store.set("contact_email", v)}
              placeholder={t("s4.q11.emailPlaceholder")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-4 text-[12px] text-error bg-error/10 border border-error/20 rounded-xl p-3">
          {error}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className={`mt-5 w-full py-3.5 rounded-full font-semibold text-sm ${
          canSubmit && !submitting ? "bg-accent-gradient" : "bg-white/20 text-white/50 cursor-not-allowed"
        }`}
      >
        {submitting ? t("nav.submitting") : t("nav.submit")}
      </button>
    </>
  );
}
