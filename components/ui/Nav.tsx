'use client';

import { motion } from 'motion/react';

import { useSectionStore } from '@/lib/section-store';
import { sections } from '@/data/sections';
import { personal } from '@/data/personal';
import { cn } from '@/lib/cn';

/**
 * Top nav — name, section links, résumé link.
 * The active section is derived from the section store so it stays synced
 * with the scroll position. The active pill is a Motion `layoutId` shared
 * element, so it glides from link to link as you scroll.
 */
export function Nav() {
  const activeIndex = useSectionStore((s) => s.section);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-ink-950/60 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a
          href="#hero"
          className="font-display text-xl text-slate-bright transition hover:text-cyan"
        >
          {personal.name}
        </a>

        <ul className="hidden items-center gap-1 rounded-full border border-white/10 bg-ink-900/60 p-1 backdrop-blur-md md:flex">
          {sections.slice(1).map((s, i) => {
            // +1 because we sliced off the hero section (index 0).
            const active = activeIndex === i + 1;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={cn(
                    'relative block rounded-full px-4 py-1.5 text-sm transition',
                    active ? 'text-slate-bright' : 'text-slate-soft hover:text-slate-bright'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative">{s.label}</span>
                </a>
              </li>
            );
          })}
        </ul>

        <a
          href={personal.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-slate-soft transition hover:text-cyan"
        >
          Résumé ↗
        </a>
      </nav>
    </header>
  );
}
