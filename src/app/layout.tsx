import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeoBank — Modern Banking",
  description: "A modern neobank powered by Paxos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen" style={{ background: '#0a0a0f' }}>
        {children}
      </body>
    </html>
  );
}
