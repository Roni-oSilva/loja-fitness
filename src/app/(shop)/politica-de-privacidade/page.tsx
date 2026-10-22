import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { DEFAULT_PRIVACY } from "@/lib/legal-defaults";
import { getStoreSettings } from "@/lib/services/catalog";

export const revalidate = 300;
export const metadata: Metadata = { title: "Política de Privacidade", alternates: { canonical: "/politica-de-privacidade" } };

export default async function Page() {
  const s = await getStoreSettings();
  return <LegalPage title="Política de Privacidade" text={s.privacy_text} fallback={DEFAULT_PRIVACY} />;
}
