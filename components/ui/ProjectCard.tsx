'use client';

import { useEffect, useState } from 'react';
import type { Project } from '@/data/projects';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

interface Props {
  project: Project;
}

const STATUS_LABELS: Record<Project['status'], string> = {
  production: 'In production',
  active: 'Active dev',
  shipped: 'Shipped',
  ongoing: 'Ongoing',
};

const STATUS_DOT: Record<Project['status'], string> = {
  production: 'bg-mint shadow-[0_0_10px_rgb(var(--color-mint))]',
  active: 'bg-cyan shadow-[0_0_10px_rgb(var(--color-cyan))]',
  shipped: 'bg-cyan/60',
  ongoing: 'bg-slate-soft',
};

export function ProjectCard({ project }: Props) {
  const [hovered, setHovered] = useState(false);
  // Only track hover on devices that actually support it — touch devices
  // would otherwise "stick" in an expanded state after a tap. Default to
  // true so SSR / first paint shows the collapsed teaser, then correct
  // down for coarse pointers after mount.
  const [canHover, setCanHover] = useState(true);
  const accentBorder =
    project.accent === 'cyan' ? 'hover:border-cyan/60' : 'hover:border-mint/60';
  const accentText = project.accent === 'cyan' ? 'text-cyan' : 'text-mint';
  const accentGlow =
    project.accent === 'cyan'
      ? 'from-cyan/10 via-transparent to-transparent'
      : 'from-mint/10 via-transparent to-transparent';

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover)');
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <motion.article
      className={cn(
        'pointer-events-auto group relative flex flex-col overflow-hidden rounded-sm border border-white/5 bg-ink-900/80 backdrop-blur-sm',
        accentBorder
      )}
      // Spring-physics hover lift — replaces the old CSS scale transition.
      animate={hovered ? { scale: 1.015, y: -2 } : { scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      onMouseEnter={() => canHover && setHovered(true)}
      onMouseLeave={() => canHover && setHovered(false)}
    >
      {/* Accent gradient wash on hover — opacity handled by the spring above's
          sibling motion driven via hovered state */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500',
          accentGlow,
          hovered && 'opacity-100'
        )}
      />

      {/* Cover image / placeholder */}
      <div className="relative aspect-square w-full overflow-hidden border-b border-white/5 bg-ink-950">
        {project.coverImage ? (
          <CoverImage src={project.coverImage} name={project.name} accent={project.accent} hovered={hovered} />
        ) : (
          <ProjectPlaceholder accent={project.accent} />
        )}
        {/* Status pill */}
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-ink-950/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-soft backdrop-blur">
          <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[project.status])} />
          {STATUS_LABELS[project.status]}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className={cn('font-display text-xl font-semibold tracking-tight', accentText)}>
              {project.name}
            </h3>
            <p className="mt-0.5 text-sm text-slate-soft">{project.tagline}</p>
          </div>
          <span className="shrink-0 font-mono text-xs text-slate-muted">{project.year}</span>
        </div>

        <p
          className={cn(
            'overflow-hidden text-sm leading-relaxed text-slate-text transition-[max-height] duration-500 ease-out',
            // Touch devices have no hover: always show the full copy.
            // Hover-capable devices: 3-line teaser that smoothly expands.
            hovered || !canHover ? 'line-clamp-none max-h-96' : 'line-clamp-3 max-h-[4.5rem]'
          )}
        >
          {project.description}
        </p>

        {/* Tech chips */}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {project.tech.map((t) => (
            <span
              key={t}
              className="rounded-sm border border-white/5 bg-white/[0.02] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-soft"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Links + role */}
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-muted">
            {project.role}
          </span>
          <div className="flex gap-2">
            {project.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'pointer-events-auto group/link flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider transition',
                  accentText,
                  'hover:underline underline-offset-4'
                )}
              >
                {link.label}
                <span className="transition group-hover/link:translate-x-0.5">↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/** Cover well: image centered at contain size, faint accent grid on top. */
function CoverImage({ src, name, accent, hovered }: { src: string; name: string; accent: 'cyan' | 'mint'; hovered: boolean }) {
  const colorVar = accent === 'cyan' ? 'var(--color-cyan)' : 'var(--color-mint)';
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink-950">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} preview`}
        className={cn('max-h-[70%] max-w-[70%] object-contain transition-transform duration-700', hovered ? 'scale-105' : '')}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: `linear-gradient(to right, rgb(${colorVar} / 0.1255) 1px, transparent 1px), linear-gradient(to bottom, rgb(${colorVar} / 0.1255) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
}

/** SVG placeholder used when no coverImage is provided for a project. */
function ProjectPlaceholder({ accent }: { accent: 'cyan' | 'mint' }) {
  const colorVar = accent === 'cyan' ? 'var(--color-cyan)' : 'var(--color-mint)';
  return (
    <div className="relative h-full w-full bg-gradient-to-br from-ink-800 to-ink-950">
      {/* Faint grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `linear-gradient(to right, rgb(${colorVar} / 0.0824) 1px, transparent 1px), linear-gradient(to bottom, rgb(${colorVar} / 0.0824) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
      {/* Centered motif */}
      <svg
        viewBox="0 0 100 60"
        className="absolute inset-0 h-full w-full opacity-40"
        preserveAspectRatio="xMidYMid meet"
      >
        <circle cx="50" cy="30" r="6" fill={colorVar} opacity="0.3" />
        <circle cx="50" cy="30" r="2" fill={colorVar} />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x = 50 + Math.cos(angle) * 22;
          const y = 30 + Math.sin(angle) * 14;
          return (
            <g key={i}>
              <line
                x1="50"
                y1="30"
                x2={x}
                y2={y}
                stroke={colorVar}
                strokeWidth="0.3"
                opacity="0.5"
              />
              <circle cx={x} cy={y} r="0.8" fill={colorVar} />
            </g>
          );
        })}
      </svg>
      <span className="absolute bottom-3 right-3 font-mono text-[9px] uppercase tracking-wider text-slate-muted">
        Drop image → /public/images/projects/*
      </span>
    </div>
  );
}
