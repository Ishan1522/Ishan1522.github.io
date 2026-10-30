import { personal } from '@/data/personal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Reveal } from '@/components/ui/Reveal';

/**
 * About section. Left-aligned content so the aurora shows through the
 * right half of the viewport.
 */
export function About() {
  return (
    <section
      id="about"
      className="relative flex min-h-[100svh] items-center px-6 py-24"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 md:grid-cols-12">
        <div className="md:col-span-6 md:col-start-1">
          <Reveal>
            <SectionLabel index="01" label="About" className="mb-8" />

            <h2 className="mb-8 font-display text-display-lg font-semibold tracking-tight text-slate-bright">
              Infrastructure, simulation, and <span className="text-cyan">signal processing</span>.
            </h2>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="space-y-5 text-base leading-relaxed text-slate-text">
              {personal.about.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Right column intentionally empty — the aurora fills this negative space. */}
        <div className="hidden md:col-span-5 md:col-start-8 md:block" aria-hidden />
      </div>
    </section>
  );
}
