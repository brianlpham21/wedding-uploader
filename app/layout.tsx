import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const montserrat = Montserrat({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

const norway = localFont({
  src: "./Norway.ttf",
  variable: "--font-norway",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wedding Photos",
  description: "Upload and share wedding memories",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${norway.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
