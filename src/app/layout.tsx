import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Sistema de Gestão de Refeições",
  description: "Sistema completo para gestão de refeições e controle nutricional",
  icons: {
    icon: '/favico.png',
    shortcut: '/favico.png',
    apple: '/favico.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favico.png" />
        <link rel="shortcut icon" type="image/png" href="/favico.png" />
        <link rel="apple-touch-icon" type="image/png" href="/favico.png" />
      </head>
      <body
        className={`${montserrat.variable} font-montserrat antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
