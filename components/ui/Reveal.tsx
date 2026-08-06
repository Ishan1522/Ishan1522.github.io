'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { motion, useInView, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/cn';

interface RevealProps {
  children: ReactNode;
  /** Stagger delay in seconds (e.g. index * 0.06). */
  delay?: number;
  className?: string;
}

/** Signature ease from the original hook — kept for identical feel. */
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Reveal-on-scroll wrapper, powered by Motion's `useInView` (viewport
 * detection) + `animate` (spring/tween). Same public API as the previous
 * IntersectionObserver-based implementation, so every call site works
 * unchanged.
 *
 * SSR / no-JS safety is preserved: the hidden state is only applied *after*
 * mount, so the server render and any JS-less client render show content
 * immediately. `prefers-reduced-motion: reduce` users see content fully
 * visible with no animation (MotionConfig reducedMotion="user" also covers
 * this globally).
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const inView = useInView(ref, {
    once: true,
    amount: 0.15,
    margin: '0px 0px -12% 0px',
  });

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

  // Bridge useInView into state so we keep the same post-mount gating.
  useEffect(() => {
    if (mounted && inView) setVisible(true);
  }, [mounted, inView]);

  const animate = mounted && !reduced;

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      initial={animate && !visible ? { opacity: 0, y: '1rem' } : false}
      animate={animate ? { opacity: visible ? 1 : 0, y: visible ? 0 : '1rem' } : undefined}
      transition={{
        duration: 0.55,
        ease: EASE,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
