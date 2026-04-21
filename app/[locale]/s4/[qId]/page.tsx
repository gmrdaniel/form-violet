import { notFound } from "next/navigation";
import { S4Wizard } from "@/components/screens/S4Wizard";

export default async function S4Page({
  params,
}: {
  params: Promise<{ locale: string; qId: string }>;
}) {
  const { qId } = await params;
  const n = parseInt(qId, 10);
  if (![9, 10, 11].includes(n)) notFound();
  return <S4Wizard qId={n as 9 | 10 | 11} />;
}
