import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "La Neta — Queremos escucharte",
  description: "3 minutos. Ayudanos a diseñar nuevos servicios para creadores.",
  openGraph: {
    title: "La Neta — Queremos escucharte",
    description: "3 minutos. Ayudanos a diseñar nuevos servicios para creadores.",
    images: ["/opengraph-image"],
    locale: "es_MX",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "es" | "en")) notFound();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}
