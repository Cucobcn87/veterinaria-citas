import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import "./globals.css";

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pide cita online | Bastet Centro Veterinario",
  description:
    "Reserva tu cita veterinaria online en Bastet Centro Veterinario (Parets del Vallès).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${firaSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
