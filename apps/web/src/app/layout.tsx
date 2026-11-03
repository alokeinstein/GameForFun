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
        <header className="border-b border-noir-800 bg-noir-900/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blood-600 to-blood-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blood-600/30">
                M
              </div>
              <span className="font-extrabold text-lg tracking-wider text-white">
                MAFIA <span className="text-blood-500 text-xs font-mono px-1.5 py-0.5 rounded bg-blood-600/10 border border-blood-500/20">3D</span>
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono text-noir-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>SERVER ONLINE</span>
              </span>
              <span>v0.1.0</span>
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)] flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
