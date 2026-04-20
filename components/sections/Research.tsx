import { research } from '@/data/research';
import { ResearchCard } from '@/components/ui/ResearchCard';
import { SectionLabel } from '@/components/ui/SectionLabel';

/**
 * Research section. Cards on the right side so the neuron is visible
 * through the left — mirrors About's layout but reversed, so the visual
 * rhythm alternates as the user scrolls.
 */
export function Research() {
  return (
    <section
      id="research"
      className="relative flex min-h-[100svh] items-center px-6 py-24"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 md:grid-cols-12">
        {/* Left: intentionally open — neuron shows through */}
        <div className="hidden md:col-span-4 md:col-start-1 md:block" aria-hidden>
          <div className="sticky top-32">
            <SectionLabel index="03" label="Research" className="mb-6" />
            <h2 className="font-display text-display-lg font-semibold tracking-tight text-slate-bright">
              <span className="text-mint">Three tracks</span> I&apos;m <span className="text-cyan">actively</span> pursuing.
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-slate-soft">
              Everything code-first. I trust a concept once I&apos;ve built it and watched it run.
            </p>
          </div>
        </div>

        {/* Mobile header (shown only on sm and below) */}
        <div className="md:hidden">
          <SectionLabel index="03" label="Research" className="mb-6" />
          <h2 className="mb-4 font-display text-display-lg font-semibold tracking-tight text-slate-bright">
            <span className="text-mint">Three tracks</span> I&apos;m <span className="text-cyan">actively</span> pursuing.
          </h2>
        </div>

        {/* Right: research cards */}
        <div className="flex flex-col gap-6 md:col-span-7 md:col-start-6">
          {research.map((track) => (
            <ResearchCard key={track.slug} track={track} />
          ))}
        </div>
      </div>
    </section>
  );
}
