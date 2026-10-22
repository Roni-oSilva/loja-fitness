import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "./env";

/** Cliente com a sessão do usuário (cookies). Respeita RLS. Retorna null se o Supabase não estiver configurado. */
export async function createClient() {
  const { url, anon, configured } = publicEnv();
  if (!configured) return null;
  const store = await cookies();
  return createServerClient(url as string, anon as string, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* Server Component: o proxy renova a sessão */ }
      },
    },
  });
}
