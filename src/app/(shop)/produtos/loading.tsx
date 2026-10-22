export default function Loading() {
  return (
    <div className="container-x py-12" role="status" aria-label="Carregando produtos">
      <div className="skeleton h-12 w-72" />
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i}><div className="skeleton aspect-[4/5]" /><div className="skeleton mt-3 h-4 w-3/4" /><div className="skeleton mt-2 h-5 w-1/3" /></div>)}</div>
    </div>
  );
}
