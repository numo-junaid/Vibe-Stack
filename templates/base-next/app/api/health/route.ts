import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    stack: {
      framework: 'Next.js 16 (App Router)',
      css: 'Tailwind CSS v4',
      database: 'Supabase PostgreSQL',
      aiContext: ['.cursorrules', 'AGENTS.md', 'llms.txt'],
    },
    message: 'Vibe-Stack API is active and ready for agentic execution.',
  });
}
