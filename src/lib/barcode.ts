/** Código de barras Code 39 (padrão aberto). Cada caractere = 9 elementos (barra/espaço alternados), 3 deles largos. */
const PATTERNS: Record<string, string> = {
  "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn", "4": "nnnwwnnnw", "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw",
  "8": "wnnwnnwnn", "9": "nnwwnnwnn", A: "wnnnnwnnw", B: "nnwnnwnnw", C: "wnwnnwnnn", D: "nnnnwwnnw", E: "wnnnwwnnn", F: "nnwnwwnnn", G: "nnnnnwwnw",
  H: "wnnnnwwnn", I: "nnwnnwwnn", J: "nnnnwwwnn", K: "wnnnnnnww", L: "nnwnnnnww", M: "wnwnnnnwn", N: "nnnnwnnww", O: "wnnnwnnwn", P: "nnwnwnnwn",
  Q: "nnnnnnwww", R: "wnnnnnwwn", S: "nnwnnnwwn", T: "nnnnwnwwn", U: "wwnnnnnnw", V: "nwwnnnnnw", W: "wwwnnnnnn", X: "nwnnwnnnw", Y: "wwnnwnnnn",
  Z: "nwwnwnnnn", "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", "*": "nwnnwnwnn",
};

export interface Bar { x: number; w: number }

/** Retorna as barras pretas (x, largura) e a largura total, em módulos. Texto inválido retorna null. */
export function code39(text: string): { bars: Bar[]; width: number } | null {
  const t = text.toUpperCase();
  if (!t || [...t].some((c) => !PATTERNS[c] || c === "*")) return null;
  const full = `*${t}*`;
  const bars: Bar[] = []; let x = 0;
  [...full].forEach((ch, ci) => {
    [...(PATTERNS[ch] as string)].forEach((el, i) => {
      const w = el === "w" ? 3 : 1;
      if (i % 2 === 0) bars.push({ x, w });
      x += w;
    });
    if (ci < full.length - 1) x += 1; // espaço entre caracteres
  });
  return { bars, width: x };
}
