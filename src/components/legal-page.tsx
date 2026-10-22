import { LEGAL_DISCLAIMER } from "@/lib/legal-defaults";

export function LegalPage({ title, text, fallback }: { title: string; text: string | null; fallback: string }) {
  const body = text ?? fallback;
  return (
    <div className="container-x max-w-3xl py-10 sm:py-14">
      <h1 className="h-section">{title}</h1>
      {!text && <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-900">{LEGAL_DISCLAIMER}</p>}
      <div className="mt-6 space-y-4 leading-relaxed text-neutral-800">
        {body.split(/\n{2,}/).map((para, i) => {
          const [first, ...rest] = para.split("\n");
          return rest.length && first && first.length < 70 && !first.endsWith(".") ? <section key={i}><h2 className="font-display text-2xl font-bold uppercase">{first}</h2><p className="mt-1 whitespace-pre-line">{rest.join("\n")}</p></section> : <p key={i} className="whitespace-pre-line">{para}</p>;
        })}
      </div>
    </div>
  );
}
