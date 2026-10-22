import clsx, { type ClassValue } from "clsx";

export const cn = (...i: ClassValue[]) => clsx(i);

export function slugify(input: string): string {
  return input.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

/** Aceita apenas caminhos internos ("/x"), bloqueando "//host", "/\\host" e esquemas externos. */
export function safeInternalPath(input: string | null | undefined, fallback = "/"): string {
  if (!input || !input.startsWith("/") || input.startsWith("//") || input.startsWith("/\\") || /[\u0000-\u001f]/.test(input)) return fallback;
  return input;
}

/** Link de destino de banner/CTA: caminho interno ou https. */
export function isSafeLink(url: string): boolean {
  return (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) || /^https:\/\/[^\s]+$/.test(url);
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
