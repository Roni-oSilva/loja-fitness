import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Loja Fitness", template: "%s" },
  openGraph: { type: "website", locale: "pt_BR" },
};
export const viewport: Viewport = { themeColor: "#111318", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
