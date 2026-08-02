'use client';

import type { ReactNode } from 'react';

import { useReveal } from '@/hooks/useReveal';
import { cn } from '@/lib/cn';

interface RevealProps {
  children: ReactNode;
  /** Stagger delay in seconds (e.g. index * 0.06). */
  delay?: number;
  className?: string;
}

/**
 * Reveal-on-scroll wrapper. Renders a plain div that fades/slides up when it
 * enters the viewport. Pass `delay` to stagger lists. Respects
 * `prefers-reduced-motion` and renders visible for SSR / no-JS.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const { ref, style } = useReveal<HTMLDivElement>({ delay });
  return (
    <div ref={ref} style={style} className={cn(className)}>
      {children}
    </div>
  );
}
