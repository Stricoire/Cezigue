import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import FeedbackWidget from "@/components/FeedbackWidget";
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
      <body className={`${poppins.variable} font-sans min-h-screen antialiased bg-background text-foreground flex flex-col`}>
        <div className="flex-1">
          {children}
        </div>
        <FeedbackWidget />
        <Analytics />
        
        {/* Simple Global Footer */}
        <footer className="w-full border-t border-border/40 bg-muted/20 py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Cezigue (ANTCHOUSKI !). Tous droits réservés.</p>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <a href="/cgv" className="hover:text-foreground transition-colors">CGV & CGU</a>
              <a href="/mentions-legales" className="hover:text-foreground transition-colors">Mentions Légales</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
