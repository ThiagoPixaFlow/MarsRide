import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RedRide — Mobilidade Autônoma em Marte",
  description:
    "Aplicativo de transporte autônomo na colônia marciana de Nova Acidália com motoristas de IA e mapa 3D.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[#0d0a09] text-[#f4ede6] font-sans">
        {children}
      </body>
    </html>
  );
}
