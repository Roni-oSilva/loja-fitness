const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata centavos (inteiro) como moeda brasileira. */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

/** Converte texto digitado ("1.299,90", "49,9", "49.90") em centavos. Retorna null se inválido. */
export function parseBRLToCents(input: string): number | null {
  const raw = input.trim().replace(/R\$\s?/i, "").replace(/\s/g, "");
  if (!raw) return null;
  let normalized = raw;
  if (raw.includes(",")) normalized = raw.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(raw)) normalized = raw.replace(/\./g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [int = "0", frac = ""] = normalized.split(".");
  return Number(int) * 100 + Number(frac.padEnd(2, "0"));
}

export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}
