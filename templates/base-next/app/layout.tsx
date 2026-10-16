import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Vibe-Stack | AI-Optimized Next.js App',
  description: 'Production-ready Next.js 16 + Tailwind v4 + Supabase architecture with pre-tuned AI context engines.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090a0f] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-purple-500 selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">
          <p>Scaffolded with create-vibe-app • Built for Agentic Loops</p>
        </footer>
      </body>
    </html>
  );
}
