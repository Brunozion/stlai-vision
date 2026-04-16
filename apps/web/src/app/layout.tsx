import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STLAI MVP",
  description: "Geracao automatizada de anuncios com IA para marketplaces.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
