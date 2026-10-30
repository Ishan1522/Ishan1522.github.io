import { projects } from '@/data/projects';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Projects showcase. Featured projects get a full-width card; the rest sit
 * in a two-column grid (one column on mobile).
 */
export function Projects() {
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <section
      id="projects"
      className="relative min-h-[100svh] px-6 py-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <div className="mb-14 max-w-2xl">
            <SectionLabel label="Projects" className="mb-4" />
            <h2 className="font-display text-display-lg text-slate-bright">
              Things I&apos;ve <em className="text-cyan">built</em>.
            </h2>
            <p className="mt-5 text-slate-soft">
              Production SaaS, robotics simulation, signal-processing tools, and infrastructure I run myself.
            </p>
          </div>
        </Reveal>

        <div className="flex flex-col gap-6">
          {featured.map((project) => (
            <Reveal key={project.slug}>
              <ProjectCard project={project} />
            </Reveal>
          ))}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {rest.map((project, i) => (
              <Reveal key={project.slug} delay={(i % 2) * 0.08}>
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
