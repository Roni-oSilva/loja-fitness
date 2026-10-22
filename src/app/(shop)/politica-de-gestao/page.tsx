import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { DEFAULT_MANAGEMENT } from "@/lib/legal-defaults";
import { getStoreSettings } from "@/lib/services/catalog";

export const revalidate = 300;
export const metadata: Metadata = { title: "Política de Gestão", alternates: { canonical: "/politica-de-gestao" } };

export default async function Page() {
  const s = await getStoreSettings();
  return <LegalPage title="Política de Gestão" text={s.management_text} fallback={DEFAULT_MANAGEMENT} />;
}
