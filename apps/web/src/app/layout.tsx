import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAFIA 3D — Social Deduction Game",
  description: "A fast, lightweight, browser-based 3D multiplayer social-deduction game inspired by Deadshot.io and traditional Mafia.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-noir-950 text-slate-100 antialiased selection:bg-blood-600 selection:text-white">
        <main className="min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}

