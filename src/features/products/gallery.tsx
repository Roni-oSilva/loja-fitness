"use client";
import { useState } from "react";
import { SafeImage } from "@/components/safe-image";
import { cn } from "@/lib/utils";

export function Gallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [i, setI] = useState(0);
  if (!images.length) return <div className="grid aspect-[4/5] place-items-center rounded-3xl bg-mist text-neutral-600">Sem imagem</div>;
  const cur = images[i] as { url: string; alt: string };
  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-mist"><SafeImage src={cur.url} alt={cur.alt || name} priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" /></div>
      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2" aria-label="Fotos do produto">
          {images.map((im, idx) => (
            <li key={idx}><button type="button" onClick={() => setI(idx)} aria-label={`Ver foto ${idx + 1} de ${images.length}`} aria-current={idx === i}
              className={cn("relative block aspect-square w-full overflow-hidden rounded-2xl border-2", idx === i ? "border-ink" : "border-transparent")}><SafeImage src={im.url} alt="" sizes="100px" className="object-cover" /></button></li>
          ))}
        </ul>)}
    </div>
  );
}
