import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // Importamos el Navbar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Viajes Anzoátegui",
  description: "La red de transporte de Anzoátegui",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Navbar /> {/* Se verá en todas las páginas */}
        {children}
      </body>
    </html>
  );
}