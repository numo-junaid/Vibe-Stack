import { NextResponse } from 'next/server';
import pkg from '@/package.json';

export async function GET() {
  const deps = (pkg.dependencies ?? {}) as Record<string, string>;
  const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>;

  const nextDep = deps['next'] || '^15.1.7';
  const majorVersion = nextDep.replace(/^[^\d]*/, '').split('.')[0] || '15';
  const hasSupabase = Boolean(deps['@supabase/supabase-js']);
  const hasTailwind = Boolean(devDeps['tailwindcss'] || deps['tailwindcss']);

  return NextResponse.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    stack: {
      framework: `Next.js ${majorVersion} (App Router)`,
      css: hasTailwind ? 'Tailwind CSS v4' : 'Standard CSS',
      database: hasSupabase ? 'Supabase PostgreSQL' : 'REST Route Handlers',
      aiContext: ['.cursorrules', 'AGENTS.md', 'llms.txt'],
    },
    version: {
      next: nextDep,
      app: pkg.version || '0.1.0',
    },
    message: 'Vibe-Stack API is active and ready for agentic execution.',
  });
}
