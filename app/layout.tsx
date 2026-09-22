import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Giro Certo — Controle financeiro do motoboy",
  description: "Organize os clientes, registre os serviços e acompanhe os gastos mensais da sua moto.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
import "./ui-extras.css";
import "./account.css";
