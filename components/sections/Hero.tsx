'use client';

import { useEffect, useRef, useState } from 'react';

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import type { Variants } from 'motion/react';

import { personal } from '@/data/personal';
import { ScrollHint } from '@/components/ui/ScrollHint';

/** Signature ease — the site's cubic-bezier, typed as a Motion Easing tuple. */
const EASE = [0.22, 1, 0.36, 1] as const;

/** Entrance variants — staggered fade-up, signature ease. */
const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

export function Hero() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  // Gate the entrance animation on mount so SSR / no-JS renders the hero fully
  // visible (repo convention: "SSR / no-JS always renders visible"). After
  // mount the stagger plays.
  const [mounted, setMounted] = useState(false);

  // Scroll-linked parallax — the hero text drifts up and dims as you scroll
  // away. Skipped entirely for reduced-motion users.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex min-h-[100svh] items-center justify-center px-6"
    >
      <motion.div
        className="relative flex flex-col items-center gap-8 text-center"
        style={reduced ? undefined : { y, opacity }}
      >
        {/* Depth scrim — darkens behind text so neuron feels like it punches through */}
        <div className="pointer-events-none absolute inset-[-4rem] -z-10 bg-radial-glow opacity-40" />

        {reduced || !mounted ? (
          <StaticHeroContent />
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center gap-8"
          >
            <motion.p
              variants={item}
              className="font-mono text-[10px] uppercase tracking-[0.4em] text-slate-muted"
            >
              42.7370°N · 84.4839°W · {personal.location}
            </motion.p>

            <motion.h1
              variants={item}
              className="font-display text-display-xl font-semibold text-slate-bright/75"
              style={{ textShadow: '0 0 80px rgb(var(--color-cyan) / 0.15), 0 0 20px rgb(var(--color-cyan) / 0.08)' }}
            >
              {personal.name}
            </motion.h1>

            <motion.div
              variants={item}
              className="flex items-center gap-4 font-mono text-xs uppercase tracking-[0.25em] text-slate-soft"
            >
              <span className="h-px w-8 bg-cyan/50" />
              <span>{personal.role}</span>
              <span className="text-slate-muted">·</span>
              <span>{personal.institution}</span>
              <span className="h-px w-8 bg-cyan/50" />
            </motion.div>

            <motion.div variants={item} className="pt-12">
              <ScrollHint />
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}

/** Static hero for prefers-reduced-motion — identical content, no motion. */
function StaticHeroContent() {
  return (
    <div className="flex flex-col items-center gap-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-slate-muted">
        42.7370°N · 84.4839°W · {personal.location}
      </p>

      <h1
        className="font-display text-display-xl font-semibold text-slate-bright/75"
        style={{ textShadow: '0 0 80px rgb(var(--color-cyan) / 0.15), 0 0 20px rgb(var(--color-cyan) / 0.08)' }}
      >
        {personal.name}
      </h1>

      <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-[0.25em] text-slate-soft">
        <span className="h-px w-8 bg-cyan/50" />
        <span>{personal.role}</span>
        <span className="text-slate-muted">·</span>
        <span>{personal.institution}</span>
        <span className="h-px w-8 bg-cyan/50" />
      </div>

      <div className="pt-12">
        <ScrollHint />
      </div>
    </div>
  );
}
