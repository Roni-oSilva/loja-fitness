import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "./env";

/** Renova a sessão e, para /admin, exige usuário autenticado (a checagem de PAPEL é refeita no servidor em cada página/ação). */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anon, configured } = publicEnv();
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");
  const isLogin = request.nextUrl.pathname === "/admin/login";

  if (!configured) {
    if (isAdmin && !isLogin) return NextResponse.redirect(new URL("/admin/login", request.url));
    return response;
  }
  const supabase = createServerClient(url as string, anon as string, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  if (isAdmin && !isLogin && !data?.claims) {
    const redirect = NextResponse.redirect(new URL("/admin/login", request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}
