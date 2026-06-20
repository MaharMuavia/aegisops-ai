import type { Metadata } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ReactQueryProvider from "@/components/ReactQueryProvider";

// Dark SOC app keeps Geist
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Public-facing "Operational Broadsheet" type system
const bricolage = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], display: "swap" });
const hanken = Hanken_Grotesk({ variable: "--font-body", subsets: ["latin"], display: "swap" });
const jetbrains = JetBrains_Mono({ variable: "--font-data", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "AegisOps AI – Incident Response Command Center",
  description: "Enterprise multi-agent security operations command center orchestrated by UiPath Maestro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${hanken.variable} ${jetbrains.variable} antialiased`}
      >
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
