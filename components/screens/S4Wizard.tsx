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

const COUNTRY_CODES = [
  { code: "+52", flag: "🇲🇽", label: "México" },
  { code: "+1",  flag: "🇺🇸", label: "EE.UU." },
  { code: "+1",  flag: "🇨🇦", label: "Canadá" },
  { code: "+54", flag: "🇦🇷", label: "Argentina" },
  { code: "+57", flag: "🇨🇴", label: "Colombia" },
  { code: "+56", flag: "🇨🇱", label: "Chile" },
  { code: "+51", flag: "🇵🇪", label: "Perú" },
  { code: "+55", flag: "🇧🇷", label: "Brasil" },
  { code: "+34", flag: "🇪🇸", label: "España" },
  { code: "+598", flag: "🇺🇾", label: "Uruguay" },
  { code: "+58", flag: "🇻🇪", label: "Venezuela" },
  { code: "+593", flag: "🇪🇨", label: "Ecuador" },
  { code: "+591", flag: "🇧🇴", label: "Bolivia" },
  { code: "+595", flag: "🇵🇾", label: "Paraguay" },
  { code: "+506", flag: "🇨🇷", label: "Costa Rica" },
  { code: "+507", flag: "🇵🇦", label: "Panamá" },
  { code: "+502", flag: "🇬🇹", label: "Guatemala" },
  { code: "+503", flag: "🇸🇻", label: "El Salvador" },
  { code: "+504", flag: "🇭🇳", label: "Honduras" },
  { code: "+505", flag: "🇳🇮", label: "Nicaragua" },
  { code: "+53", flag: "🇨🇺", label: "Cuba" },
  { code: "+1",  flag: "🇩🇴", label: "Rep. Dominicana" },
  { code: "+1",  flag: "🇵🇷", label: "Puerto Rico" },
] as const;

function splitPhone(full: string | undefined | null): { lada: string; numero: string } {
  if (!full) return { lada: "+52", numero: "" };
  const trimmed = full.trim();
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const { code } of sorted) {
    if (trimmed.startsWith(code)) {
      return { lada: code, numero: trimmed.slice(code.length).trim() };
    }
  }
  return { lada: "+52", numero: trimmed };
}

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

  const initial = splitPhone(store.contact_phone);
  const [lada, setLada] = useState(initial.lada);
  const [numero, setNumero] = useState(initial.numero);

  const updatePhone = (nextLada: string, nextNumero: string) => {
    const digits = nextNumero.replace(/\D/g, "");
    store.set("contact_phone", digits ? `${nextLada} ${digits}` : "");
  };

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
            <div className="flex gap-2">
              <select
                value={`${lada}|${COUNTRY_CODES.find((c) => c.code === lada)?.label ?? ""}`}
                onChange={(e) => {
                  const nextLada = e.target.value.split("|")[0];
                  setLada(nextLada);
                  updatePhone(nextLada, numero);
                }}
                className="px-3 py-3.5 text-sm rounded-xl bg-raised border border-[rgba(255,255,255,0.12)] focus:border-white/40 focus:outline-none appearance-none pr-8 text-white"
                style={{
                  colorScheme: "dark",
                  backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='white' stroke-opacity='0.5' stroke-width='1.5' fill='none'/></svg>\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                }}
              >
                {COUNTRY_CODES.map((c) => (
                  <option
                    key={`${c.flag}-${c.code}-${c.label}`}
                    value={`${c.code}|${c.label}`}
                    style={{ backgroundColor: "#1A1A22", color: "white" }}
                  >
                    {c.flag} {c.code} {c.label}
                  </option>
                ))}
              </select>
              <div className="flex-1">
                <TextInput
                  type="tel"
                  value={numero}
                  onChange={(v: string) => {
                    const digits = v.replace(/\D/g, "");
                    setNumero(digits);
                    updatePhone(lada, digits);
                  }}
                  placeholder="55 1234 5678"
                />
              </div>
            </div>
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
