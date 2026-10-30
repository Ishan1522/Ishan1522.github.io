import { personal } from '@/data/personal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Reveal } from '@/components/ui/Reveal';

/** Contact section — a direct email and a few social links. */
export function Contact() {
  const links = [
    { label: 'GitHub', href: personal.githubUrl, value: `@${personal.github}` },
    { label: 'LinkedIn', href: personal.linkedin, value: 'ishan-acharya-gangopadhyay' },
    { label: 'Résumé', href: personal.resumeUrl, value: 'PDF' },
  ];

  return (
    <section
      id="contact"
      className="relative flex min-h-[100svh] flex-col justify-center px-6 py-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <SectionLabel label="Contact" className="mb-4" />

          <h2 className="max-w-3xl font-display text-display-lg text-slate-bright">
            Looking for <em className="text-cyan">summer 2027</em> internships.
          </h2>

          <p className="mt-6 max-w-lg text-lg text-slate-soft">
            Backend, infrastructure, robotics, or ML systems. Email is the fastest way to reach me.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <a
            href={`mailto:${personal.email}`}
            className="group mt-10 inline-flex items-center gap-3 rounded-full bg-cyan px-8 py-3.5 font-medium text-ink-950 transition hover:bg-cyan-glow"
          >
            {personal.email}
            <span className="transition group-hover:translate-x-1">→</span>
          </a>
        </Reveal>

        <Reveal delay={0.16}>
          <ul className="mt-16 flex flex-wrap gap-x-12 gap-y-6 border-t border-white/10 pt-8">
            {links.map((link) => (
              <li key={link.label}>
                <div className="mb-1 text-xs text-slate-muted">{link.label}</div>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto text-slate-text transition hover:text-cyan"
                >
                  {link.value}
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <p className="mx-auto mt-24 w-full max-w-6xl text-xs text-slate-muted">
        © {new Date().getFullYear()} {personal.fullName}
      </p>
    </section>
  );
}
