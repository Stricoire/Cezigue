import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Cezigue - Votre portail des mobilités",
  description: "Cezigue - Votre portail des mobilités",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="light">
      <body className={`${poppins.variable} font-sans min-h-screen antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
