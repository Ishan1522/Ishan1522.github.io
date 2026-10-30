import Link from 'next/link';

import { StaticFallback } from '@/components/three/StaticFallback';

export default function NotFound() {
  return (
    <section className="relative flex min-h-[100svh] items-center px-6">
      <StaticFallback />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <p className="mb-4 text-sm font-medium text-cyan">404</p>

        <h1 className="font-display text-display-lg text-slate-bright">
          Page <em className="text-cyan">not found</em>.
        </h1>

        <p className="mt-5 max-w-md text-lg text-slate-soft">
          That page doesn&apos;t exist. It may have been moved or renamed.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-cyan px-6 py-2.5 text-sm font-medium text-ink-950 transition hover:bg-cyan-glow"
          >
            Back home
          </Link>
          <Link
            href="/#projects"
            className="rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-slate-bright transition hover:border-cyan/60 hover:text-cyan"
          >
            See projects
          </Link>
        </div>
      </div>
    </section>
  );
}
