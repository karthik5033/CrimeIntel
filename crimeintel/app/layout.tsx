import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_Kannada } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { LanguageProvider } from "@/lib/LanguageContext";
import { AuthProvider } from "@/lib/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSansKannada = Noto_Sans_Kannada({
  subsets: ["kannada"],
  variable: "--font-kannada",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CrimeIntel | AI Investigator Copilot",
  description: "Advanced AI-powered investigative intelligence platform for Karnataka State Police.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${notoSansKannada.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <LanguageProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Toaster position="top-right" richColors />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
