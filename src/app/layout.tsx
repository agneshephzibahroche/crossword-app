import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Letterbeat",
  description: "A lively daily crossword game with fresh 5x5 puzzles and archived play.",
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
