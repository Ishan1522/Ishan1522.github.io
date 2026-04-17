import { personal } from '@/data/personal';
import { ScrollHint } from '@/components/ui/ScrollHint';

/**
 * Hero section. Intentionally sparse — the neuron is the show.
 * Name + role + scroll indicator. That's it.
 */
export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] items-center justify-center px-6"
    >
      <div className="flex flex-col items-center gap-8 text-center">
        {/* Coordinate readout — plays up the scientific-instrument vibe */}
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-slate-muted">
          42.7370°N · 84.4839°W · {personal.location}
        </p>

        <h1 className="font-display text-display-xl font-semibold text-slate-bright">
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
