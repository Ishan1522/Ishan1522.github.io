import { personal } from '@/data/personal';
import { SectionLabel } from '@/components/ui/SectionLabel';

/**
 * Contact section. Kept minimal — a direct email, a few social links,
 * and the neuron blazing behind everything at its peak firing rate.
 */
export function Contact() {
  const links = [
    { label: 'Email', href: `mailto:${personal.email}`, value: personal.email },
    { label: 'GitHub', href: personal.githubUrl, value: `@${personal.github}` },
    { label: 'LinkedIn', href: personal.linkedin, value: 'ishan-acharya-gangopadhyay' },
  ];

  return (
    <section
      id="contact"
      className="relative flex min-h-[100svh] items-center justify-center px-6 py-24"
    >
      <div className="mx-auto w-full max-w-3xl text-center">
        <SectionLabel index="05" label="Contact" className="mx-auto mb-10 w-fit" />

        <h2 className="font-display text-display-lg font-semibold tracking-tight text-slate-bright">
          Let&apos;s <span className="text-cyan">build</span> something.
        </h2>

        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-slate-soft">
          Interested in collaborations, research, internships, or just a conversation about
          neurons and silicon. I reply to everything.
        </p>

        {/* Primary CTA */}
        <div className="mt-12 flex flex-col items-center gap-6">
          <a
            href={`mailto:${personal.email}`}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-sm border border-cyan bg-cyan/10 px-8 py-3.5 font-mono text-sm uppercase tracking-[0.2em] text-cyan transition hover:bg-cyan/20"
          >
            <span className="relative z-10">{personal.email}</span>
            <span className="relative z-10 transition group-hover:translate-x-1">→</span>
            {/* Scan-line effect on hover */}
            <span className="pointer-events-none absolute inset-0 translate-y-full bg-gradient-to-b from-transparent via-cyan/20 to-transparent transition-transform duration-700 group-hover:translate-y-[-100%]" />
          </a>
        </div>

        {/* Secondary links */}
        <ul className="mt-16 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-12">
          {links.map((link) => (
            <li key={link.href} className="text-center">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-slate-muted">
                {link.label}
              </div>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-slate-text transition hover:text-cyan"
              >
                {link.value}
              </a>
            </li>
          ))}
        </ul>

        {/* Footer mark */}
        <div className="mt-24 flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-slate-muted">
          <span className="h-px w-12 bg-white/10" />
          <span>EOF · {new Date().getFullYear()}</span>
          <span className="h-px w-12 bg-white/10" />
        </div>
      </div>
    </section>
  );
}
