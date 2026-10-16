'use client';

import React, { useState } from 'react';
import { FileCode, FileText, Users, CheckCircle2 } from 'lucide-react';

export function ContextDisplay() {
  const [activeTab, setActiveTab] = useState<'cursor' | 'agents' | 'llms'>('cursor');

  const tabs = [
    {
      id: 'cursor' as const,
      name: '.cursorrules',
      icon: <FileCode className="w-4 h-4 text-cyan-400" />,
      desc: 'Operational loop directives for Cursor & Windsurf',
      codeSnippet: `# High-Density Operational Rules for Agentic Loops
- React Server Components (RSC) by default; minimize 'use client'
- In Server Actions/Routes: createClient() from @/lib/supabase/server
- Strict PostgreSQL Row Level Security (RLS) enforcement
- Atomic modifications & type soundness across all files`,
    },
    {
      id: 'agents' as const,
      name: 'AGENTS.md',
      icon: <Users className="w-4 h-4 text-purple-400" />,
      desc: 'Role division & handoff boundaries',
      codeSnippet: `# Multi-Agent Role Division & Execution Boundaries
@architect -> System design, dependencies, and API contracts
@frontend  -> React components, Tailwind v4 styling, UX states
@database  -> Supabase schemas, RLS policies, migrations
@qa        -> Type integrity, security validation, regression tests`,
    },
    {
      id: 'llms' as const,
      name: 'llms.txt',
      icon: <FileText className="w-4 h-4 text-pink-400" />,
      desc: 'Semantic architecture map for LLM crawlers',
      codeSnippet: `# Semantic Definition of the Stack
- Framework: Next.js (App Router, React 19, TypeScript)
- Styling: Tailwind CSS v4 design tokens
- Backend: Supabase SSR client/server cookie handling
- Lib paths: lib/supabase/server.ts, lib/supabase/client.ts`,
    },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab)!;

  return (
    <section className="py-12 px-6 max-w-5xl mx-auto">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Active AI Context Engines
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              These files are automatically injected into your project root.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 mb-3 flex items-center justify-between">
          <span>{currentTab.desc}</span>
          <span className="text-[11px] text-purple-400">Read-Only Preview</span>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 border border-white/10 font-mono text-xs sm:text-sm text-slate-300 overflow-x-auto leading-relaxed">
          <code>{currentTab.codeSnippet}</code>
        </pre>
      </div>
    </section>
  );
}
