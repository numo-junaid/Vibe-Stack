'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check, ArrowRight, Zap, ShieldCheck, Cpu } from 'lucide-react';
import { TechBadge } from './TechBadge';

export function Hero() {
  const [copied, setCopied] = useState(false);
  const command = 'npx create-vibe-app my-vibe-app';

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-20 pb-16 px-6 overflow-hidden">
      {/* Ambient gradient lights */}
      <div className="ambient-blur bg-purple-600 w-96 h-96 top-0 left-1/4 -translate-x-1/2" />
      <div className="ambient-blur bg-cyan-500 w-96 h-96 top-10 right-1/4 translate-x-1/2" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:border-purple-500/40 transition-colors">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs text-slate-300 font-medium">Pre-tuned for Autonomous Coding Agents</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
          Architect at the Speed of{' '}
          <span className="glow-gradient-text">Thought.</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          A production-ready stack scaffolded specifically for agentic loops. Next.js 15, Tailwind v4, and Supabase pre-loaded with high-density architectural context engines.
        </p>

        {/* Stack Badges */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <TechBadge label="Next.js (App Router)" category="Core" />
          <TechBadge label="Tailwind CSS v4" category="Styling" />
          <TechBadge label="Supabase & Auth" category="Backend" />
          <TechBadge label="TypeScript Strict" category="Typing" />
          <TechBadge label="Cursor & Copilot Rules" category="AI Context" />
        </div>

        {/* Interactive CLI Command Box */}
        <div className="max-w-md mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300" />
          <div className="relative flex items-center justify-between px-4 py-3 bg-slate-950/90 border border-white/10 rounded-xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs sm:text-sm font-mono text-slate-200">{command}</span>
            </div>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
