import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ReactQueryProvider from "@/components/ReactQueryProvider";

// Inter type system — heavy, tight display headings + a clean body, matching brand
const interTight = Inter_Tight({ variable: "--font-display", subsets: ["latin"], display: "swap" });
const inter = Inter({ variable: "--font-body", subsets: ["latin"], display: "swap" });
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
        className={`${interTight.variable} ${inter.variable} ${jetbrains.variable} antialiased`}
      >
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
