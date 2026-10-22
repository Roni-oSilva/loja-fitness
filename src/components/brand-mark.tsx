/** Símbolo da marca (órbitas entrelaçadas + brilhos) desenhado em SVG para ficar nítido em qualquer tamanho. */
export function BrandMark({ className = "size-9", spin = false }: { className?: string; spin?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Ana Fitness" fill="none">
      <g className={spin ? "spin-slow" : undefined} style={{ transformOrigin: "32px 32px" }}>
        <ellipse cx="32" cy="32" rx="25" ry="11" transform="rotate(45 32 32)" stroke="var(--brand)" strokeWidth="7" />
        <ellipse cx="32" cy="32" rx="25" ry="11" transform="rotate(-45 32 32)" stroke="var(--brand)" strokeWidth="7" strokeDasharray="0 0" opacity=".92" />
      </g>
      <g fill="var(--brand)"><path d="M32 2l1.8 3.4L37 7l-3.2 1.7L32 12l-1.8-3.3L27 7l3.2-1.6z" /><path d="M32 52l1.8 3.4L37 57l-3.2 1.7L32 62l-1.8-3.3L27 57l3.2-1.6z" /></g>
    </svg>
  );
}
