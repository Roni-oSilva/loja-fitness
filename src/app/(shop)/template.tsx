/** Transição suave a cada navegação (o template remonta por rota). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
