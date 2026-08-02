'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';

interface RevealOptions {
  /** Fraction of the element that must be visible before revealing. */
  threshold?: number;
  /** IntersectionObserver rootMargin — shrinks/grows the detection box. */
  rootMargin?: string;
  /** Transition delay in seconds — use for staggering lists. */
  delay?: number;
}

/**
 * Reveal-on-scroll hook.
 *
 * Wraps an element so it starts hidden (`opacity-0 translate-y-4`) and fades
 * up into view once it enters the viewport (IntersectionObserver). Gated on
 * `prefers-reduced-motion` via useReducedMotion — reduced-motion users see
 * content fully visible with no animation.
 *
 * SSR / no-JS safety: the hidden state is only applied *after* mount, so the
 * server render and any JS-less client render show content immediately.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options: RevealOptions = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -12% 0px', delay = 0 } = options;
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Hidden state only applies after mount — SSR / no-JS always renders visible.
  // Also check the initial viewport position here (same effect pass, batched
  // with setMounted) so above-the-fold content never flashes to hidden before
  // the observer's first callback.
  useEffect(() => {
    const el = ref.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setVisible(true);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !mounted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted, reduced, threshold, rootMargin]);

  const animate = mounted && !reduced;

  const style: CSSProperties | undefined = animate
    ? {
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(1rem)',
        transition: `opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
      }
    : undefined;

  return { ref, style };
}
