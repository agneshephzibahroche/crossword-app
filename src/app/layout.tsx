import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Letterbeat",
  description: "A lively daily crossword game with fresh 5x5 puzzles and archived play.",
  applicationName: "Letterbeat",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Letterbeat",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/icon.svg",
    apple: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="dark">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
