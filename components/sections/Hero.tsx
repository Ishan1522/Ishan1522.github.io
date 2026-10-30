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
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
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

  const animated = mounted && !reduced;

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex min-h-[100svh] items-center px-6"
    >
      <motion.div
        className="mx-auto w-full max-w-6xl"
        style={reduced ? undefined : { y, opacity }}
      >
        {/* Remounts when the animation switches on so `initial` is re-read. */}
        <HeroContent key={animated ? 'animated' : 'static'} animated={animated} />
      </motion.div>
      <div className="absolute bottom-10 left-6 md:left-[max(1.5rem,calc((100vw-72rem)/2))]">
        <ScrollHint />
      </div>
    </section>
  );
}

function HeroContent({ animated }: { animated: boolean }) {
  return (
    <motion.div
      variants={container}
      initial={animated ? 'hidden' : false}
      animate="show"
      className="flex flex-col items-start gap-8"
    >
      <motion.p variants={item} className="text-sm text-slate-soft">
        {personal.fullName} · {personal.role}, {personal.institution}
      </motion.p>

      <motion.h1
        variants={item}
        className="max-w-4xl font-display text-display-lg text-slate-bright"
      >
        {personal.headline.before}
        <em className="text-cyan">{personal.headline.em}</em>
        {personal.headline.after}
      </motion.h1>

      <motion.div variants={item} className="flex flex-wrap items-center gap-3 pt-2">
        <a
          href="#projects"
          className="rounded-full bg-cyan px-6 py-2.5 text-sm font-medium text-ink-950 transition hover:bg-cyan-glow"
        >
          See projects
        </a>
        <a
          href={personal.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-slate-bright transition hover:border-cyan/60 hover:text-cyan"
        >
          Résumé ↗
        </a>
      </motion.div>
    </motion.div>
  );
}
