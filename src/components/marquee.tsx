import { BrandMark } from "./brand-mark";

/** Faixa animada com o nome da loja (decorativa, oculta de leitores de tela). */
export function Marquee({ text, reverse }: { text: string; reverse?: boolean }) {
  const items = Array.from({ length: 8 }, (_, i) => i);
  return (
    <div className="marquee mt-6 overflow-hidden bg-ink py-5 text-white sm:mt-10 sm:py-7" aria-hidden>
      <div className={`marquee-track ${reverse ? "reverse" : ""}`}>
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-8 pr-8 font-display text-5xl font-extrabold tracking-tight sm:gap-12 sm:pr-12 sm:text-8xl">
            {items.map((i) => (
              <span key={i} className="flex items-center gap-8 sm:gap-12">
                <span className={i % 2 ? "text-brand" : ""} style={i % 2 ? undefined : { WebkitTextStroke: "2px #fff", color: "transparent" }}>{text}</span>
                <BrandMark className="size-9 sm:size-14" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
