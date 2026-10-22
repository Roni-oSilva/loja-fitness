import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { DEFAULT_RETURNS } from "@/lib/legal-defaults";
import { getStoreSettings } from "@/lib/services/catalog";

export const revalidate = 300;
export const metadata: Metadata = { title: "Trocas e Devoluções", alternates: { canonical: "/trocas-e-devolucoes" } };

export default async function Page() {
  const s = await getStoreSettings();
  return <LegalPage title="Trocas e Devoluções" text={s.returns_text} fallback={DEFAULT_RETURNS} />;
}
