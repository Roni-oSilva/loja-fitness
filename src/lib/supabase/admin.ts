import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Cliente com service_role: ignora RLS. Uso EXCLUSIVO no servidor, para operações que validamos manualmente. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL não configurada");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
