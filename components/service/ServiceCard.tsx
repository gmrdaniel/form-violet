"use client";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { PriceRow } from "@/components/fields/PriceRow";
import type { ServiceConfig } from "@/lib/services";
import { useFormStore } from "@/lib/store";

export function ServiceCard({ service, index }: { service: ServiceConfig; index: number }) {
  const t = useTranslations();
  const state = useFormStore((s) => s.services[service.id]);
  const setService = useFormStore((s) => s.setService);

  const interest = state?.interest ?? null;
  const priceMonthly = state?.priceMonthly ?? null;
  const priceSetup = state?.priceSetup ?? null;

  const setInterest = (v: "very" | "somewhat" | "none") => {
    if (v === "none") {
      setService(service.id, { interest: v, priceMonthly: null, priceSetup: null, serviceId: service.id });
    } else {
      setService(service.id, { interest: v, serviceId: service.id });
    }
  };

  const isCollapsed = interest === "none";

  const reopen = () => {
    setService(service.id, { interest: undefined as unknown as "very", priceMonthly: null, priceSetup: null, serviceId: service.id });
  };

  return (
    <motion.div
      layout
      onClick={isCollapsed ? reopen : undefined}
      className={clsx(
        "rounded-2xl border p-3.5 mb-2.5 transition-colors",
        isCollapsed
          ? "bg-raised border-[rgba(255,255,255,0.05)] opacity-60 cursor-pointer hover:opacity-80"
          : interest
          ? "bg-raised-selected border-[rgba(255,255,255,0.18)]"
          : "bg-raised border-border-subtle"
      )}
    >
      <div className="flex justify-between items-start gap-2.5">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] tracking-widest text-white/40">{String(index + 1).padStart(2, "0")} / 13</div>
          <div className="text-[14px] font-semibold mt-0.5 mb-1">{t(service.nameKey)}</div>
          {!isCollapsed && (
            <div className="text-[12px] text-white/65 leading-snug">{t(service.descriptionKey)}</div>
          )}
        </div>
        {isCollapsed && (
          <span className="text-[11px] px-2 py-1 rounded-full bg-white/8 text-white/70 whitespace-nowrap">
            {t("s2.price.notInterestedBadge")}
          </span>
        )}
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {(["very", "somewhat", "none"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setInterest(v)}
              className={clsx(
                "py-2.5 px-2 rounded-[10px] text-[12px] font-medium border transition-colors",
                interest === v
                  ? "bg-white text-black border-white"
                  : "bg-raised border-[rgba(255,255,255,0.12)] text-white"
              )}
            >
              {t(`s2.interest.${v}`)}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence initial={false}>
        {interest && interest !== "none" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/6">
              <div className="text-[11px] text-white/50 mb-1.5">
                {service.hasSetupFee ? t("s2.price.labelSetup") : t("s2.price.label")}
              </div>
              <PriceRow
                prices={service.prices}
                value={priceMonthly}
                onChange={(v) =>
                  setService(service.id, { priceMonthly: v, serviceId: service.id })
                }
              />
              {service.hasSetupFee && service.priceSetup && (
                <div className="mt-2">
                  <div className="text-[11px] text-white/50 mb-1.5">Setup</div>
                  <PriceRow
                    prices={service.priceSetup}
                    value={priceSetup}
                    onChange={(v) =>
                      setService(service.id, { priceSetup: v, serviceId: service.id })
                    }
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
