import { personal } from '@/data/personal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Reveal } from '@/components/ui/Reveal';

/**
 * About section. Left-aligned content so the neuron shows through the
 * right half of the viewport — matches the "neuron peeks through negative
 * space" concept from the layout spec.
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
              Engineering <span className="text-cyan">at the edge</span> of <span className="text-mint">electricity</span> and <span className="text-cyan">thought</span>.
            </h2>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="space-y-5 text-base leading-relaxed text-slate-text">
              {personal.about.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {/* Tag strip */}
            <ul className="mt-10 flex flex-wrap gap-2">
              {['Electrical Engineering', 'Full-stack', 'DSP', 'ML Systems', 'Robotics', 'Neuroscience'].map((tag) => (
                <li
                  key={tag}
                  className="rounded-sm border border-cyan/20 bg-cyan/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-cyan"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Right column intentionally empty — the neuron fills this negative space. */}
        <div className="hidden md:col-span-5 md:col-start-8 md:block" aria-hidden />
      </div>
    </section>
  );
}
