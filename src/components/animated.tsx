"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** Luz que acompanha o mouse e inclinação 3D leve; desligado em telas de toque e com movimento reduzido. */
export function Pointer({ children, className, glow = true }: { children: ReactNode; className?: string; glow?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--mx", `${x * 100}%`); el.style.setProperty("--my", `${y * 100}%`);
      el.style.setProperty("--rx", `${(0.5 - y) * 8}deg`); el.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
    };
    const leave = () => ["--rx", "--ry"].forEach((k) => el.style.setProperty(k, "0deg"));
    el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, []);
  return <div ref={ref} className={`${glow ? "hero-glow" : ""} ${className ?? ""}`}>{children}</div>;
}

/** Cartão de marca com inclinação que reage ao mouse do pai (variáveis --rx/--ry). */
export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`tilt ${className ?? ""}`}>{children}</div>;
}

const COLORS = ["var(--brand)", "var(--accent)", "var(--ink)", "#fff"];
/** Chuva de confetes (uma vez) ao registrar o pedido. */
export function Confetti() {
  const [pieces, setPieces] = useState<{ s: CSSProperties; k: number }[]>([]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setPieces(Array.from({ length: 48 }, (_, k) => ({ k, s: {
      left: `${Math.random() * 100}%`, background: COLORS[k % COLORS.length], border: "1px solid rgba(11,16,45,.15)",
      ["--dx" as string]: `${(Math.random() - 0.5) * 220}px`, ["--rot" as string]: `${360 + Math.random() * 720}deg`,
      ["--dur" as string]: `${2.6 + Math.random() * 1.8}s`, ["--delay" as string]: `${Math.random() * 0.6}s`,
    } as CSSProperties }))), 0);
    const end = setTimeout(() => setPieces([]), 6000);
    return () => { clearTimeout(t); clearTimeout(end); };
  }, []);
  return <div aria-hidden>{pieces.map((p) => <span key={p.k} className="confetti" style={p.s} />)}</div>;
}
