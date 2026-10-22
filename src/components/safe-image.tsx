import Image from "next/image";

function allowed(src: string) {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const host = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
    return host != null && new URL(src).hostname === host;
  } catch { return false; }
}

interface Props { src: string; alt: string; sizes?: string; priority?: boolean; className?: string; fill?: boolean; width?: number; height?: number }

/** next/image para origens conhecidas (assets locais e Supabase Storage); <img> simples para qualquer outra. */
export function SafeImage({ src, alt, sizes = "100vw", priority, className, ...rest }: Props) {
  if (src.endsWith(".svg") || !allowed(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" className={className} style={(rest.fill ?? true) ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } : undefined} />;
  }
  return <Image src={src} alt={alt} sizes={sizes} priority={priority} className={className} fill={rest.fill ?? true} />;
}
