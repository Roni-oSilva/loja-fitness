import Link from "next/link";

export function EmptyState({ title, text, href, cta }: { title: string; text?: string; href?: string; cta?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-mist px-6 py-14 text-center">
      <p className="font-display text-3xl font-extrabold uppercase">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-neutral-700">{text}</p>}
      {href && cta && <Link href={href} className="btn btn-dark mt-6">{cta}</Link>}
    </div>
  );
}
