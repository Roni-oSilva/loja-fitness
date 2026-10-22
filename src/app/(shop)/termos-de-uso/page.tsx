import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { DEFAULT_TERMS } from "@/lib/legal-defaults";
import { getStoreSettings } from "@/lib/services/catalog";

export const revalidate = 300;
export const metadata: Metadata = { title: "Termos de Uso", alternates: { canonical: "/termos-de-uso" } };

export default async function Page() {
  const s = await getStoreSettings();
  return <LegalPage title="Termos de Uso" text={s.terms_text} fallback={DEFAULT_TERMS} />;
}
