import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <p className="eyebrow">Erro 404</p>
      <h1 className="h-section mt-2">Página não encontrada</h1>
      <p className="mx-auto mt-3 max-w-md text-neutral-700">O endereço pode ter mudado ou o produto não está mais disponível.</p>
      <div className="mt-6 flex justify-center gap-3"><Link href="/" className="btn btn-dark">Ir para o início</Link><Link href="/produtos" className="btn btn-outline">Ver produtos</Link></div>
    </div>
  );
}
