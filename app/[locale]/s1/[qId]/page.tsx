import { notFound } from "next/navigation";
import { S1Wizard } from "@/components/screens/S1Wizard";

export default async function S1Page({
  params,
}: {
  params: Promise<{ locale: string; qId: string }>;
}) {
  const { qId } = await params;
  const n = parseInt(qId, 10);
  if (!Number.isInteger(n) || n < 1 || n > 6) notFound();
  return <S1Wizard qId={n} />;
}
