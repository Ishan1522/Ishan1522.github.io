import { projects } from '@/data/projects';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Projects showcase. 3-column tile grid (2 on tablet, 1 on mobile).
 * Hover expands the description and lifts the tile slightly.
 * Flow-field particles peek through below the grid and between tiles.
 */
export function Projects() {
  return (
    <section
      id="projects"
      className="relative min-h-[100svh] px-6 py-24"
    >
      <div className="mx-auto w-full max-w-7xl">
        {/* Header — pushed to the left so the middle stays visually open */}
        <Reveal>
          <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <SectionLabel index="02" label="Projects" className="mb-6" />
              <h2 className="font-display text-display-lg font-semibold tracking-tight text-slate-bright">
                Things I&apos;ve <span className="text-cyan">built</span>, <span className="text-mint">shipped</span>, and <span className="text-cyan">still think about</span>.
              </h2>
            </div>
            <div className="md:col-span-4 md:col-start-9 md:self-end">
              <p className="text-sm leading-relaxed text-slate-soft">
                A selection — production SaaS, Rust DSP tooling, and embedded CI. Hover a tile to read more; click any link to jump out.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <Reveal key={project.slug} delay={i * 0.06}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
