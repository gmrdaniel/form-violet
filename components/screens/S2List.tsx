"use client";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Container } from "@/components/chrome/Container";
import { ProgressBar } from "@/components/chrome/ProgressBar";
import { LangSelector } from "@/components/chrome/LangSelector";
import { ServiceCard } from "@/components/service/ServiceCard";
import { SERVICES } from "@/lib/services";

export function S2List() {
  const t = useTranslations("s2");
  const locale = useLocale();
  const router = useRouter();

  return (
    <>
      <LangSelector />
      <Container variant="scroll">
        <ProgressBar section={2} percent={30} minsLeft={2} />
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-[18px] font-semibold mb-1">{t("sectionTitle")}</h2>
          <p className="text-[13px] text-white/60 mb-5">{t("intro")}</p>

          {SERVICES.map((svc, i) => (
            <ServiceCard key={svc.id} service={svc} index={i} />
          ))}

          <button
            onClick={() => router.push(`/${locale}/s3`)}
            className="mt-4 block w-full py-3.5 rounded-full bg-white text-black font-semibold text-sm"
          >
            {t("continueCta")}
          </button>
        </motion.div>
      </Container>
    </>
  );
}
