import { useTranslations } from "next-intl";

export default function WelcomePage() {
  const t = useTranslations("welcome");
  return <div className="p-8">{t("title")}</div>;
}
