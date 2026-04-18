'use client';

/**
 * Smooth scroll + scroll-driven state.
 *
 * Responsibilities:
 *   1. Lenis handles the actual smooth scrolling (momentum, easing).
 *   2. GSAP's ticker drives Lenis each frame.
 *   3. Each section gets a ScrollTrigger that flips the neuron store's
 *      `section` when that section enters viewport center.
 *   4. A second ScrollTrigger tracks total document progress (0..1)
 *      for any components that want a continuous value instead of discrete.
 *
 * If `disabled` (e.g. prefers-reduced-motion), we skip all of this and
 * just let native scroll handle things. The neuron canvas won't be rendered
 * in that case either, so no ScrollTrigger is needed.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollProgress } from '@/lib/neuron-store';
import { useNeuronStore } from '@/lib/neuron-store';
import { sections } from '@/data/sections';

interface Props {
  children: ReactNode;
  disabled?: boolean;
}

export function SmoothScrollProvider({ children, disabled = false }: Props) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (disabled) return;

    // Register the plugin exactly once, client-side.
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    // Feed Lenis to ScrollTrigger so the two systems agree on scroll position.
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    const { setSection } = useNeuronStore.getState();
    // One ScrollTrigger per section — fires onEnter/onEnterBack to flip state.
    const triggers: ScrollTrigger[] = [];
    sections.forEach((section, index) => {
      const el = document.getElementById(section.id);
      if (!el) return;
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setSection(index),
        onEnterBack: () => setSection(index),
      });
      triggers.push(st);
    });

    // Continuous 0..1 progress across the whole document.
    const progressST = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => { scrollProgress.current = self.progress; },
    });
    triggers.push(progressST);

    // Refresh once to measure everything now that triggers are registered.
    ScrollTrigger.refresh();

    return () => {
      triggers.forEach((t) => t.kill());
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [disabled]);

  return <>{children}</>;
}
