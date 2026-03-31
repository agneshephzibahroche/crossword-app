import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Crossword",
  description: "A newspaper-inspired daily crossword game with archived puzzles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
