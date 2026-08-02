import { personal } from '@/data/personal';
import { ScrollHint } from '@/components/ui/ScrollHint';

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] items-center justify-center px-6"
    >
      <div className="relative flex flex-col items-center gap-8 text-center">
        {/* Depth scrim — darkens behind text so neuron feels like it punches through */}
        <div className="pointer-events-none absolute inset-[-4rem] -z-10 bg-radial-glow opacity-40" />

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
    </section>
  );
}