import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center px-6">
      {/* Static neuron backdrop */}
      <svg
        viewBox="0 0 800 600"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-35"
        aria-hidden
      >
        <defs>
          <radialGradient id="soma404" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="400" cy="300" r="80" fill="url(#soma404)" />
        <circle cx="400" cy="300" r="18" fill="#67e8f9" />
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          const r2 = 260 + Math.sin(i * 1.3) * 40;
          const x1 = 400 + Math.cos(a) * 30, y1 = 300 + Math.sin(a) * 30;
          const x2 = 400 + Math.cos(a) * r2, y2 = 300 + Math.sin(a) * r2;
          const cx = 400 + Math.cos(a + 0.3) * r2 * 0.6;
          const cy = 300 + Math.sin(a + 0.3) * r2 * 0.6;
          return (
            <g key={i}>
              <path d={`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`} stroke="#22d3ee" strokeWidth="1" fill="none" opacity="0.6" />
              <circle cx={x2} cy={y2} r="3" fill="#34d399" />
            </g>
          );
        })}
      </svg>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-10 text-center">
        {/* Telemetry */}
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-slate-muted">
          Signal lost · no route matched · /?
        </p>

        {/* 404 lockup */}
        <div className="relative">
          <span className="font-display font-semibold text-slate-bright/25" style={{ fontSize: 'clamp(6rem, 18vw, 14rem)', lineHeight: 0.9, letterSpacing: '-0.04em' }}>
            404
          </span>
          <span className="animate-flicker absolute inset-0 flex items-center justify-center font-mono text-xs uppercase tracking-[0.4em] text-cyan">
            unreachable
          </span>
        </div>

        {/* Heading */}
        <div>
          <h1 className="font-display text-display-md font-semibold tracking-tight text-slate-bright">
            This <span className="text-mint">neuron</span> didn&apos;t <span className="text-cyan">fire</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-soft">
            The page you asked for isn&apos;t in the graph. It may have been moved, renamed, or never existed.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-sm border border-cyan bg-cyan/10 px-8 py-3.5 font-mono text-sm uppercase tracking-[0.2em] text-cyan transition hover:bg-cyan/20"
          >
            <span className="relative z-10">Back to home</span>
            <span className="relative z-10 transition group-hover:translate-x-1">→</span>
            <span className="pointer-events-none absolute inset-0 translate-y-full bg-gradient-to-b from-transparent via-cyan/20 to-transparent transition-transform duration-700 group-hover:translate-y-[-100%]" />
          </Link>
          <Link
            href="/#projects"
            className="inline-flex items-center gap-2 rounded-sm border border-cyan/40 bg-cyan/5 px-5 py-3.5 font-mono text-sm uppercase tracking-[0.15em] text-cyan transition hover:border-cyan hover:bg-cyan/10"
          >
            See projects
            <span className="transition group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        {/* Error meta */}
        <div className="flex gap-6 font-mono text-[10px] uppercase tracking-[0.3em] text-slate-muted">
          <span>err · ROUTE_NOT_FOUND</span>
          <span>·</span>
          <span>code · 0x194</span>
        </div>
      </div>
    </section>
  );
}
