'use client';

import { useState } from 'react';
import type { Project } from '@/data/projects';
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
  production: 'bg-mint shadow-[0_0_10px_#34d399]',
  active: 'bg-cyan shadow-[0_0_10px_#22d3ee]',
  shipped: 'bg-cyan/60',
  ongoing: 'bg-slate-soft',
};

export function ProjectCard({ project }: Props) {
  const [hovered, setHovered] = useState(false);
  const accentBorder =
    project.accent === 'cyan' ? 'hover:border-cyan/60' : 'hover:border-mint/60';
  const accentText = project.accent === 'cyan' ? 'text-cyan' : 'text-mint';
  const accentGlow =
    project.accent === 'cyan'
      ? 'from-cyan/10 via-transparent to-transparent'
      : 'from-mint/10 via-transparent to-transparent';

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-sm border border-white/5 bg-ink-900/80 backdrop-blur-sm transition-all duration-500',
        accentBorder,
        hovered ? 'scale-[1.015]' : ''
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Accent gradient wash on hover */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500',
          accentGlow,
          hovered && 'opacity-100'
        )}
      />

      {/* Cover image / placeholder */}
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-white/5 bg-ink-950">
        {project.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.coverImage}
            alt={`${project.name} preview`}
            className={cn(
              'h-full w-full object-cover transition-transform duration-700',
              hovered ? 'scale-105' : ''
            )}
          />
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
            'text-sm leading-relaxed text-slate-text transition-all duration-500',
            hovered ? 'line-clamp-none' : 'line-clamp-3'
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
                  'group/link flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider transition',
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
    </article>
  );
}

/** SVG placeholder used when no coverImage is provided for a project. */
function ProjectPlaceholder({ accent }: { accent: 'cyan' | 'mint' }) {
  const color = accent === 'cyan' ? '#22d3ee' : '#34d399';
  return (
    <div className="relative h-full w-full bg-gradient-to-br from-ink-800 to-ink-950">
      {/* Faint grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `linear-gradient(to right, ${color}15 1px, transparent 1px), linear-gradient(to bottom, ${color}15 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
      {/* Centered motif */}
      <svg
        viewBox="0 0 100 60"
        className="absolute inset-0 h-full w-full opacity-40"
        preserveAspectRatio="xMidYMid meet"
      >
        <circle cx="50" cy="30" r="6" fill={color} opacity="0.3" />
        <circle cx="50" cy="30" r="2" fill={color} />
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
                stroke={color}
                strokeWidth="0.3"
                opacity="0.5"
              />
              <circle cx={x} cy={y} r="0.8" fill={color} />
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
