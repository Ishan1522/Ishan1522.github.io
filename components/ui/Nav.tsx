'use client';

import { motion } from 'motion/react';

import { useSectionStore } from '@/lib/section-store';
import { sections } from '@/data/sections';
import { personal } from '@/data/personal';
import { cn } from '@/lib/cn';

/**
 * Top nav. Minimal — just a monogram, section links, and a resume button.
 * The active section is derived from the section store so it stays synced
 * with the scroll position. The active underline is a Motion `layoutId`
 * shared element, so it morphs smoothly from link to link as you scroll.
 */
export function Nav() {
  const activeIndex = useSectionStore((s) => s.section);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-ink-900/60 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#hero" className="group flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-cyan/40 font-mono text-xs text-cyan">
            IA
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-soft group-hover:text-cyan">
            {personal.name}
          </span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {sections.slice(1).map((s, i) => {
            // +1 because we sliced off the hero section (index 0).
            const sectionIndex = i + 1;
            const active = activeIndex === sectionIndex;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={cn(
                    'group relative px-3 py-2 font-mono text-xs uppercase tracking-wider transition',
                    active ? 'text-cyan' : 'text-slate-soft hover:text-slate-bright'
                  )}
                >
                  {s.label}
                  {active ? (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 bottom-1 h-px bg-cyan"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  ) : (
                    <span
                      className={cn(
                        'absolute inset-x-3 bottom-1 h-px origin-left bg-cyan/40 transition-transform duration-500 group-hover:scale-x-100',
                        'scale-x-0'
                      )}
                    />
                  )}
                </a>
              </li>
            );
          })}
        </ul>

        <a
          href={personal.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-sm border border-cyan/40 bg-cyan/5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-cyan transition hover:border-cyan hover:bg-cyan/10"
        >
          Résumé
          <span className="text-cyan-glow transition group-hover:translate-x-0.5">↗</span>
        </a>
      </nav>
    </header>
  );
}
