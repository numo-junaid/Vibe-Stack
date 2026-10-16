import React from 'react';

interface TechBadgeProps {
  label: string;
  category?: string;
  icon?: React.ReactNode;
}

export function TechBadge({ label, category, icon }: TechBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-300 hover:border-purple-500/50 hover:text-white transition-colors duration-200">
      {icon && <span className="text-purple-400">{icon}</span>}
      {category && <span className="text-slate-500">{category}:</span>}
      <span className="font-semibold text-slate-200">{label}</span>
    </div>
  );
}
