'use client';

import { useEffect, useState } from 'react';

import { personal } from '@/data/personal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Reveal } from '@/components/ui/Reveal';

/**
 * GitHub activity section.
 *
 * Self-hosted replacement for the old third-party SVG cards
 * (github-readme-stats / streak-stats.herokuapp.com). Fetches real data from
 * the GitHub REST API client-side on mount, with a loading skeleton and a
 * graceful fallback if the API is unreachable (no broken images — ever).
 *
 * The site is `output: 'export'` (no server), so the fetch happens in the
 * browser. Module-level cache means we hit the API at most once per page load.
 */

interface RepoSummary {
  name: string;
  stargazers_count: number;
  language: string | null;
}

interface EventSummary {
  type: string;
  created_at: string;
  repo: { name: string };
}

interface GitHubStats {
  publicRepos: number;
  followers: number;
  totalStars: number;
  languages: { name: string; count: number; pct: number }[];
  events: { label: string; repo: string; when: string }[];
}

const USERNAME = personal.github;

// One shared request promise per page load — no repeated refetching on remount.
let statsCache: Promise<GitHubStats | null> | null = null;

const EVENT_LABELS: Record<string, string> = {
  PushEvent: 'pushed to',
  CreateEvent: 'created in',
  PullRequestEvent: 'opened PR in',
  IssuesEvent: 'opened issue in',
  WatchEvent: 'starred',
  ForkEvent: 'forked',
  ReleaseEvent: 'released',
  DeleteEvent: 'deleted in',
  PublicEvent: 'made public',
};

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

async function fetchGitHubStats(): Promise<GitHubStats | null> {
  try {
    const headers = { Accept: 'application/vnd.github+json' };
    const [userRes, reposRes, eventsRes] = await Promise.all([
      fetch(`https://api.github.com/users/${USERNAME}`, { headers }),
      fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`, { headers }),
      fetch(`https://api.github.com/users/${USERNAME}/events/public?per_page=6`, { headers }),
    ]);
    if (!userRes.ok || !reposRes.ok || !eventsRes.ok) return null;

    const user = (await userRes.json()) as { public_repos?: number; followers?: number };
    const repos = (await reposRes.json()) as RepoSummary[];
    const events = (await eventsRes.json()) as EventSummary[];

    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);

    // Top languages by repo count (primary language per repo). Null-language
    // repos are skipped so the chart shows real signal, not an "Other" lump.
    const langCounts = new Map<string, number>();
    let langTotal = 0;
    for (const repo of repos) {
      if (!repo.language) continue;
      langTotal += 1;
      langCounts.set(repo.language, (langCounts.get(repo.language) ?? 0) + 1);
    }
    const languages = [...langCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / langTotal) * 100) }));

    const recentEvents = events
      .filter((e) => EVENT_LABELS[e.type])
      .slice(0, 4)
      .map((e) => ({
        label: EVENT_LABELS[e.type],
        repo: e.repo.name.replace(`${USERNAME}/`, ''),
        when: timeAgo(e.created_at),
      }));

    return {
      publicRepos: user.public_repos ?? 0,
      followers: user.followers ?? 0,
      totalStars,
      languages,
      events: recentEvents,
    };
  } catch {
    return null;
  }
}

export function GitHub() {
  const [stats, setStats] = useState<GitHubStats | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!statsCache) statsCache = fetchGitHubStats();
    let active = true;
    statsCache
      .then((result) => {
        if (!active) return;
        setStats(result);
        setStatus(result ? 'ready' : 'error');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  const username = personal.github;

  return (
    <section
      id="github"
      className="relative min-h-[100svh] px-6 py-24"
    >
      <div className="mx-auto w-full max-w-7xl">
        <Reveal>
          <div className="mb-12 text-center">
            <SectionLabel index="04" label="Activity" className="mx-auto mb-6 w-fit" />
            <h2 className="font-display text-display-lg font-semibold tracking-tight text-slate-bright">
              Firing pattern, <span className="text-cyan">by the numbers</span>.
            </h2>
            <p className="mt-4 font-mono text-xs uppercase tracking-wider text-slate-soft">
              @{username}
            </p>
          </div>
        </Reveal>

        {status === 'loading' ? (
          <StatsSkeleton />
        ) : status === 'error' || !stats ? (
          <StatsFallback />
        ) : (
          <StatsGrid stats={stats} />
        )}

        <Reveal delay={0.1}>
          <div className="mt-10 text-center">
            <a
              href={personal.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto group inline-flex items-center gap-2 rounded-sm border border-cyan/40 bg-cyan/5 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-cyan transition hover:border-cyan hover:bg-cyan/10"
            >
              View all repositories
              <span className="transition group-hover:translate-x-0.5">↗</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
 * Panel chrome — matches ProjectCard / ResearchCard treatment
 * ------------------------------------------------------------------------ */
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="h-full rounded-sm border border-white/5 bg-ink-900/70 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-cyan">
        <span className="h-px w-3 bg-cyan/40" />
        {title}
      </div>
      {children}
    </div>
  );
}

function StatsGrid({ stats }: { stats: GitHubStats }) {
  const accent = (i: number) => (i % 2 === 0 ? 'bg-cyan' : 'bg-mint');
  const accentText = (i: number) => (i % 2 === 0 ? 'text-cyan' : 'text-mint');

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Reveal>
        <Panel title="Overview">
          <div className="grid grid-cols-3 gap-4">
            <Stat value={stats.publicRepos} label="repos" />
            <Stat value={stats.totalStars} label="stars" />
            <Stat value={stats.followers} label="followers" />
          </div>
        </Panel>
      </Reveal>

      <Reveal delay={0.06}>
        <Panel title="Top languages">
          {stats.languages.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {stats.languages.map((lang, i) => (
                <li key={lang.name}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className={`font-mono text-[10px] uppercase tracking-wider ${accentText(i)}`}>
                      {lang.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-muted">{lang.count} repos</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/5">
                    <div className={`h-full rounded-full ${accent(i)}`} style={{ width: `${lang.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-mono text-xs uppercase tracking-wider text-slate-muted">no language data</p>
          )}
        </Panel>
      </Reveal>

      <Reveal delay={0.12} className="md:col-span-2">
        <Panel title="Recent activity">
          {stats.events.length > 0 ? (
            <ul className="flex flex-col">
              {stats.events.map((event, i) => (
                <li
                  key={`${event.repo}-${i}`}
                  className="flex items-center gap-3 border-b border-white/5 py-2.5 last:border-b-0"
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${accent(i)}`} />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-muted">
                    {event.label}
                  </span>
                  <span className="truncate font-mono text-xs text-slate-text">{event.repo}</span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-muted">{event.when}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-mono text-xs uppercase tracking-wider text-slate-muted">no recent public activity</p>
          )}
        </Panel>
      </Reveal>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="font-mono text-2xl font-semibold text-slate-bright">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-muted">{label}</div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {[0, 1, 2].map((i) => (
        <Reveal key={i} delay={i * 0.06} className={i === 2 ? 'md:col-span-2' : ''}>
          <div className="h-full animate-pulse rounded-sm border border-white/5 bg-ink-900/70 p-5 backdrop-blur-sm">
            <div className="mb-4 h-3 w-24 rounded-sm bg-white/10" />
            <div className="space-y-3">
              <div className="h-3 w-full rounded-sm bg-white/5" />
              <div className="h-3 w-2/3 rounded-sm bg-white/5" />
              <div className="h-3 w-5/6 rounded-sm bg-white/5" />
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

function StatsFallback() {
  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-sm border border-white/5 bg-ink-900/70 p-6 text-center backdrop-blur-sm">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-muted">
          {'// api unreachable'}
        </div>
        <p className="mt-3 font-mono text-xs uppercase tracking-wider text-slate-soft">
          couldn&apos;t load live stats
        </p>
        <a
          href={personal.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto mt-5 inline-flex items-center gap-2 rounded-sm border border-cyan/40 bg-cyan/5 px-4 py-2 font-mono text-xs uppercase tracking-wider text-cyan transition hover:border-cyan hover:bg-cyan/10"
        >
          See the repos directly
          <span>↗</span>
        </a>
      </div>
    </div>
  );
}
