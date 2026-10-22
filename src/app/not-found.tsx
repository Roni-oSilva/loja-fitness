import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="eyebrow">Erro 404</p>
      <h1 className="h-section mt-2">Página não encontrada</h1>
      <p className="mt-3 text-neutral-700">O endereço pode ter mudado ou não existe mais.</p>
      <Link href="/" className="btn btn-dark mt-6">Ir para o início</Link>
    </main>
  );
}
