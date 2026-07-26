import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { LanguageProvider } from "@/lib/LanguageContext";
import { AuthProvider } from "@/lib/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSansKannada = localFont({
  src: [
    { path: "../public/fonts/noto-sans-kannada-kannada-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/noto-sans-kannada-kannada-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/noto-sans-kannada-kannada-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/noto-sans-kannada-kannada-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-kannada",
  display: "swap",
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
