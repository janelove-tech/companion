import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Space_Mono, Unbounded } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-unbounded",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Companion",
  description: "Thoughtful messages, beautifully written.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${unbounded.variable} ${spaceMono.variable} ${cormorant.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
