export interface ImageType { mime: string; ext: string }

/** Identifica imagens pelos "magic bytes". SVG é propositalmente recusado (pode conter scripts). */
export function detectImageType(b: Uint8Array): ImageType | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return { mime: "image/png", ext: "png" };
  const s = (o: number, n: number) => String.fromCharCode(...b.slice(o, o + n));
  if (s(0, 4) === "RIFF" && s(8, 4) === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (s(4, 4) === "ftyp" && (s(8, 4) === "avif" || s(8, 4) === "avis")) return { mime: "image/avif", ext: "avif" };
  return null;
}
