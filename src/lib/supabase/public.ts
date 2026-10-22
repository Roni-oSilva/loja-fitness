import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "./env";

/** Cliente anônimo sem cookies, para leituras públicas (RLS limita ao conteúdo publicado). */
export function createPublicClient() {
  const { url, anon, configured } = publicEnv();
  if (!configured) return null;
  return createClient(url as string, anon as string, { auth: { persistSession: false, autoRefreshToken: false } });
}
