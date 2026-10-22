import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS } from "@/lib/services/catalog";
import { PageHeader } from "@/features/admin/ui-server";
import type { StoreSettings } from "@/lib/types";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Configurações" };

export default async function Settings() {
  await requireStaff("settings");
  const db = (await createClient())!;
  const { data } = await db.from("store_settings").select("*").maybeSingle();
  const { id: _i, updated_at: _u, ...rest } = (data ?? {}) as Record<string, unknown>;
  return (<><PageHeader title="Configurações" subtitle="Tudo aqui é público ou de exibição. Não coloque senhas nem chaves." /><SettingsForm s={{ ...DEFAULT_SETTINGS, ...(rest as Partial<StoreSettings>) }} /></>);
}
