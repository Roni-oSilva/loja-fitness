"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x py-24 text-center" role="alert">
      <h1 className="h-section">Algo deu errado</h1>
      <p className="mx-auto mt-3 max-w-md text-neutral-700">Não conseguimos carregar esta página. Verifique sua conexão e tente de novo.</p>
      <button type="button" onClick={reset} className="btn btn-dark mt-6">Tentar novamente</button>
    </div>
  );
}
