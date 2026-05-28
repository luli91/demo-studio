import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Studio Manager Pro | Software de Gestión",
  description: "Sistema integral de gestión para tu estudio, academia o gimnasio.",
  icons: {
    icon: "/logo-sync.png", 
  },
  openGraph: {
    title: "Studio Manager Pro",
    description: "La herramienta definitiva para gestionar alumnas, clases y finanzas.",
    siteName: "Studio Manager",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}