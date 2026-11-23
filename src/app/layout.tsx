import type { Metadata } from "next";
import { Figtree, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { NavProgress } from "@/components/nav-progress";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: { default: "Mapala", template: "%s · Mapala" },
  description: "Website resmi organisasi Mahasiswa Pecinta Alam.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${figtree.variable} ${instrument.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NavProgress />
        {children}
      </body>
    </html>
  );
}
