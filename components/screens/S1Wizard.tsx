"use client";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/chrome/Container";
import { ProgressBar } from "@/components/chrome/ProgressBar";
import { LangSelector } from "@/components/chrome/LangSelector";
import { WizardNav } from "@/components/chrome/WizardNav";
import { Pill } from "@/components/fields/Pill";
import { TextInput } from "@/components/fields/TextInput";
import { useFormStore } from "@/lib/store";
import { saveDraft } from "@/lib/draft";
import { FOLLOWER_RANGES, HOURS_RANGES, PLATFORMS, DOES_CURRENTLY } from "@/lib/schema";

const TOTAL_S1 = 6;

export function S1Wizard({ qId }: { qId: number }) {
  const t = useTranslations("s1");
  const locale = useLocale();
  const router = useRouter();
  const store = useFormStore();
  const s1Percent = ((qId - 1) / TOTAL_S1) * 20;

  const goNext = () => {
    const route = qId < TOTAL_S1 ? `/${locale}/s1/${qId + 1}` : `/${locale}/s2`;
    saveDraft({
      answers: { ...store, set: undefined, setService: undefined, reset: undefined, hydrate: undefined } as Record<string, unknown>,
      route,
    });
    router.push(route);
  };
  const goBack = () => {
    if (qId > 1) router.push(`/${locale}/s1/${qId - 1}`);
    else router.push(`/${locale}`);
  };

  return (
    <>
      <LangSelector />
      <Container variant="wizard">
        <ProgressBar section={1} percent={s1Percent} minsLeft={3} />
        <AnimatePresence mode="wait">
          <motion.div
            key={qId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <p className="text-[11px] tracking-wider text-white/45 mb-2">
              PREGUNTA {qId} / 11
            </p>

            {qId === 1 && <Q1 t={t} store={store} onEnter={goNext} />}
            {qId === 2 && <Q2 t={t} store={store} onEnter={goNext} />}
            {qId === 3 && <Q3 t={t} store={store} />}
            {qId === 4 && <Q4 t={t} store={store} goNext={goNext} />}
            {qId === 5 && <Q5 t={t} store={store} goNext={goNext} />}
            {qId === 6 && <Q6 t={t} store={store} />}

            <WizardNav
              onBack={goBack}
              onNext={goNext}
              canAdvance={canAdvance(qId, store)}
            />
          </motion.div>
        </AnimatePresence>
      </Container>
    </>
  );
}

function canAdvance(qId: number, s: ReturnType<typeof useFormStore.getState>): boolean {
  if (qId === 1) return !!s.name && s.name.trim().length >= 2;
  if (qId === 2) return !!s.handle && s.handle.trim().length >= 2;
  if (qId === 3) return (s.platforms?.length ?? 0) > 0 || !!(s.platforms_other && s.platforms_other.length > 0);
  if (qId === 4) return !!s.follower_range;
  if (qId === 5) return !!s.hours_non_content;
  if (qId === 6) return (s.does_currently?.length ?? 0) > 0;
  return false;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function Q1({ t, store, onEnter }: any) {
  return (
    <>
      <h2 className="text-[22px] font-semibold leading-tight mb-5">{t("q1.text")}</h2>
      <TextInput
        value={store.name || ""}
        onChange={(v: string) => store.set("name", v)}
        placeholder={t("q1.placeholder")}
        autoFocus
        onEnter={onEnter}
      />
    </>
  );
}

function Q2({ t, store, onEnter }: any) {
  return (
    <>
      <h2 className="text-[22px] font-semibold leading-tight mb-5">{t("q2.text")}</h2>
      <TextInput
        value={store.handle || ""}
        onChange={(v: string) => store.set("handle", v)}
        placeholder={t("q2.placeholder")}
        autoFocus
        onEnter={onEnter}
      />
    </>
  );
}

function Q3({ t, store }: any) {
  const toggle = (p: string) => {
    const cur = store.platforms || [];
    const next = cur.includes(p) ? cur.filter((x: string) => x !== p) : [...cur, p];
    store.set("platforms", next);
  };
  return (
    <>
      <h2 className="text-[22px] font-semibold leading-tight mb-2">{t("q3.text")}</h2>
      <p className="text-[12px] text-white/55 mb-4">{t("q3.hint")}</p>
      <div className="space-y-2">
        {PLATFORMS.filter((p) => p !== "other").map((p) => (
          <Pill key={p} selected={(store.platforms || []).includes(p)} onClick={() => toggle(p)}>
            {t(`q3.${p}`)}
          </Pill>
        ))}
        <Pill selected={(store.platforms || []).includes("other")} onClick={() => toggle("other")}>
          {t("q3.other")}
        </Pill>
        {(store.platforms || []).includes("other") && (
          <TextInput
            value={store.platforms_other || ""}
            onChange={(v: string) => store.set("platforms_other", v)}
            placeholder={t("q3.otherPlaceholder")}
          />
        )}
      </div>
    </>
  );
}

function Q4({ t, store, goNext }: any) {
  return (
    <>
      <h2 className="text-[22px] font-semibold leading-tight mb-5">{t("q4.text")}</h2>
      <div className="space-y-2">
        {FOLLOWER_RANGES.map((r) => (
          <Pill
            key={r}
            selected={store.follower_range === r}
            onClick={() => {
              store.set("follower_range", r);
              setTimeout(goNext, 200);
            }}
          >
            {t(`q4.${r}`)}
          </Pill>
        ))}
      </div>
    </>
  );
}

function Q5({ t, store, goNext }: any) {
  return (
    <>
      <h2 className="text-[22px] font-semibold leading-tight mb-2">{t("q5.text")}</h2>
      <p className="text-[12px] text-white/55 mb-4">{t("q5.hint")}</p>
      <div className="space-y-2">
        {HOURS_RANGES.map((r) => (
          <Pill
            key={r}
            selected={store.hours_non_content === r}
            onClick={() => {
              store.set("hours_non_content", r);
              setTimeout(goNext, 200);
            }}
          >
            {t(`q5.${r}`)}
          </Pill>
        ))}
      </div>
    </>
  );
}

function Q6({ t, store }: any) {
  const toggle = (key: string) => {
    const cur = store.does_currently || [];
    let next: string[];
    if (key === "none_of_above") {
      next = cur.includes(key) ? [] : ["none_of_above"];
    } else {
      next = cur.includes(key) ? cur.filter((x: string) => x !== key) : [...cur.filter((x: string) => x !== "none_of_above"), key];
    }
    store.set("does_currently", next);
  };
  return (
    <>
      <h2 className="text-[22px] font-semibold leading-tight mb-2">{t("q6.text")}</h2>
      <p className="text-[12px] text-white/55 mb-4">{t("q6.hint")}</p>
      <div className="space-y-2">
        {DOES_CURRENTLY.map((k) => (
          <Pill key={k} selected={(store.does_currently || []).includes(k)} onClick={() => toggle(k)}>
            {t(`q6.${k}`)}
          </Pill>
        ))}
      </div>
    </>
  );
}
