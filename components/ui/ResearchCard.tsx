'use client';

import type { ResearchTrack } from '@/data/research';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

interface Props {
  track: ResearchTrack;
}

export function ResearchCard({ track }: Props) {
  // Card chrome is uniformly interaction blue (the per-track cyan/mint
  // alternation in the data is ignored — accents never trade evenly). The
  // section's "live" signal lives in the green headline accent ("actively
  // pursuing"), not on the cards.
  const accentText = 'text-cyan';
  const accentHover = 'hover:border-cyan/40';

  return (
    <motion.article
      className={cn(
        'pointer-events-auto group relative flex flex-col gap-4 rounded-sm border border-white/5 bg-ink-900/70 p-6',
        accentHover
      )}
      // Spring lift on hover, matching ProjectCard's physics.
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    >
      <div className="flex items-baseline justify-between">
        <h3 className={cn('font-display text-2xl font-semibold tracking-tight', accentText)}>
          {track.title}
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-muted">
          {track.stage}
        </span>
      </div>

      <p className="-mt-3 font-mono text-xs uppercase tracking-wider text-slate-soft">
        {track.subtitle}
      </p>

      <p className="text-sm leading-relaxed text-slate-text">{track.description}</p>

      <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
        {track.keywords.map((k) => (
          <li
            key={k}
            className="rounded-sm border border-white/5 bg-white/[0.02] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-soft"
          >
            {k}
          </li>
        ))}
      </ul>
    </motion.article>
  );
}
