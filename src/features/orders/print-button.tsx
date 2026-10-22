"use client";
import { Printer } from "lucide-react";

export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="btn btn-outline btn-sm"><Printer className="size-4" aria-hidden />Imprimir / salvar em PDF</button>;
}
