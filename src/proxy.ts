import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware-session";

export async function proxy(request: NextRequest) {
  const res = await updateSession(request);
  if (request.nextUrl.pathname.startsWith("/admin")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
  }
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
