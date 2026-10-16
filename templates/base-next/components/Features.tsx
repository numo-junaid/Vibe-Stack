import React from 'react';
import { Cpu, Layers, ShieldCheck, Database, Bot, Zap } from 'lucide-react';

const features = [
  {
    icon: <Bot className="w-6 h-6 text-purple-400" />,
    title: 'Pre-Tuned Context Engines',
    description:
      'Dynamically injects `.cursorrules`, `AGENTS.md`, and `llms.txt` directly into your codebase. No manual prompting required for AI agents to understand the project architecture.',
    badge: 'Zero Friction',
  },
  {
    icon: <Database className="w-6 h-6 text-cyan-400" />,
    title: 'Full Supabase SSR Integration',
    description:
      'Modern server and client client adapters via `@supabase/ssr`. Complete with type-safe schemas, PostgreSQL Row Level Security (RLS) enforcement, and cookie session handling.',
    badge: 'Production Ready',
  },
  {
    icon: <Layers className="w-6 h-6 text-pink-400" />,
    title: 'Tailwind CSS v4 & App Router',
    description:
      'Engineered with modern CSS variables, glassmorphism tokens, and strict React Server Component boundaries to ensure lightning-fast rendering and minimal client bundle size.',
    badge: 'Modern Core',
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
    title: 'Multi-Agent Boundaries',
    description:
      'Defines crisp execution boundaries between `@architect`, `@frontend`, `@database`, and `@qa` agents to prevent hallucinations and merge conflicts during agentic loops.',
    badge: 'Agent Safe',
  },
];

export function Features() {
  return (
    <section className="py-16 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
          Engineered for Human-AI Pair Programming
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Every file, rule, and type declaration is designed to eliminate context loss when collaborating with autonomous coding agents.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((item, index) => (
          <div
            key={index}
            className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                {item.icon}
              </div>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                {item.badge}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
