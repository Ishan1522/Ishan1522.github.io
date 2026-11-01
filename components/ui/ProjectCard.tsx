'use client';

import { useEffect, useRef, type MouseEvent } from 'react';

import type { Project } from '@/data/projects';
import { cn } from '@/lib/cn';

interface Props {
  project: Project;
}

const STATUS_LABELS: Record<Project['status'], string> = {
  production: 'In production',
  active: 'Active',
  wip: 'Work in progress',
  parked: 'Parked',
  shipped: 'Shipped',
  ongoing: 'Ongoing',
  done: 'Done',
};

// Green dot where something is live, amber while it's a work in progress,
// slate once it's finished or parked.
const STATUS_DOT: Record<Project['status'], string> = {
  production: 'bg-emerald-400',
  active: 'bg-emerald-400',
  wip: 'bg-amber-400',
  parked: 'bg-slate-muted',
  shipped: 'bg-slate-muted',
  ongoing: 'bg-emerald-400',
  done: 'bg-slate-muted',
};

/** Pointer-following spotlight: writes CSS vars directly, no re-renders. */
function trackPointer(e: MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
}

export function ProjectCard({ project }: Props) {
  const featured = project.featured === true;

  return (
    <article
      onMouseMove={trackPointer}
      className={cn(
        'pointer-events-auto group relative flex h-full overflow-hidden rounded-2xl border border-white/10 bg-ink-900/80 transition-colors md:bg-ink-900/60 md:backdrop-blur-sm duration-300 hover:border-cyan/40',
        featured ? 'flex-col md:flex-row' : 'flex-col'
      )}
    >
      {/* Spotlight that follows the cursor */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 [background:radial-gradient(420px_circle_at_var(--mx,50%)_var(--my,50%),rgb(var(--color-cyan)/0.12),transparent_70%)] group-hover:opacity-100" />

      {project.coverImage && (
        <div
          className={cn(
            'relative shrink-0 bg-ink-950/70',
            featured ? 'min-h-64 md:w-2/5' : 'aspect-[16/10] w-full'
          )}
        >
          <div className="absolute inset-6 flex items-center justify-center">
            <CoverMedia project={project} />
          </div>
        </div>
      )}

      <div className={cn('relative flex flex-1 flex-col gap-4 p-6', featured && 'md:p-10')}>
        <div className="flex items-center gap-2 text-xs text-slate-soft">
          <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[project.status])} />
          {STATUS_LABELS[project.status]}
          <span className="text-slate-muted">· {project.year}</span>
        </div>

        <div>
          <h3
            className={cn(
              'font-display text-slate-bright',
              featured ? 'text-4xl md:text-5xl' : 'text-3xl'
            )}
          >
            {project.name}
          </h3>
          <p className="mt-1 text-slate-soft">{project.tagline}</p>
        </div>

        <p className={cn('leading-relaxed text-slate-text', featured ? 'max-w-xl' : 'text-sm')}>
          {project.description}
        </p>

        <ul className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {project.tech.map((t) => (
            <li
              key={t}
              className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-slate-soft"
            >
              {t}
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm">
          <span className="text-slate-muted">{project.role}</span>
          <div className="flex gap-4">
            {project.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto text-cyan transition hover:text-cyan-glow"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

const COVER_CLASS =
  'fade-edges max-h-full max-w-full object-contain transition-transform duration-700 group-hover:scale-105';

/**
 * Cover media. Images are lazy-decoded; videos (the GIF replacement) don't
 * fetch anything until near the viewport, then play only while visible so an
 * off-screen loop never burns battery or bandwidth on a phone.
 */
function CoverMedia({ project }: { project: Project }) {
  const src = project.coverImage;
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = src?.endsWith('.mp4') ?? false;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: '200px' }
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  if (!src) return null;

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        src={src}
        poster={project.coverPoster}
        aria-label={`${project.name} preview`}
        className={COVER_CLASS}
        muted
        loop
        playsInline
        preload="none"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${project.name} preview`}
      className={COVER_CLASS}
      loading="lazy"
      decoding="async"
    />
  );
}
