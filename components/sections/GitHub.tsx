import { personal } from '@/data/personal';
import { SectionLabel } from '@/components/ui/SectionLabel';

/**
 * GitHub activity section.
 *
 * Uses github-readme-stats (a well-maintained third-party SVG service) to
 * render live stats and a contribution streak without needing a backend.
 * Styled to match the cyberpunk palette via query params.
 *
 * If you'd rather self-host, replace the two <img> src values with your
 * own renderer or remove this section entirely.
 */
export function GitHub() {
  const username = personal.github;
  const baseParams = 'bg_color=0a0e1a&title_color=22d3ee&text_color=cbd5e1&icon_color=34d399&border_color=22d3ee33&hide_border=false';

  const stats = `https://github-readme-stats.vercel.app/api?username=${username}&${baseParams}&show_icons=true&hide_title=true&count_private=true`;
  const streak = `https://github-readme-streak-stats.herokuapp.com/?user=${username}&background=0a0e1a&stroke=22d3ee33&ring=22d3ee&fire=34d399&currStreakLabel=22d3ee&sideLabels=cbd5e1&currStreakNum=f1f5f9&sideNums=f1f5f9&dates=94a3b8`;
  const langs = `https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&${baseParams}&layout=compact&hide_title=true`;

  return (
    <section
      id="github"
      className="relative min-h-[100svh] px-6 py-24"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-12 text-center">
          <SectionLabel index="04" label="Activity" className="mx-auto mb-6 w-fit" />
          <h2 className="font-display text-display-lg font-semibold tracking-tight text-slate-bright">
            Firing pattern, <span className="text-cyan">by the numbers</span>.
          </h2>
          <p className="mt-4 font-mono text-xs uppercase tracking-wider text-slate-soft">
            @{username}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <StatCard>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stats} alt="GitHub stats" className="w-full" loading="lazy" />
          </StatCard>
          <StatCard>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={langs} alt="Top languages" className="w-full" loading="lazy" />
          </StatCard>
          <div className="md:col-span-2">
            <StatCard>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={streak} alt="Contribution streak" className="w-full" loading="lazy" />
            </StatCard>
          </div>
        </div>

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
      </div>
    </section>
  );
}

function StatCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-white/5 bg-ink-900/70 p-5 backdrop-blur-sm">
      {children}
    </div>
  );
}
