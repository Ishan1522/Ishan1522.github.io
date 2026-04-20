'use client';

import dynamic from 'next/dynamic';
import { type ReactNode } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SmoothScrollProvider } from './providers/SmoothScrollProvider';
import { StaticFallback } from './three/StaticFallback';

// Lazy-load the Scene so the WebGL bundle isn't in the initial JS payload.
// ssr: false because R3F touches window during setup.
const Scene = dynamic(() => import('./three/Scene').then((m) => m.Scene), {
  ssr: false,
  loading: () => null,
});

/**
 * Orchestrates the two rendering modes:
 *
 *   Default: full-motion
 *     → StaticFallback is still rendered as a first paint (so the user sees
 *       something before the WebGL bundle loads), then <Scene> mounts on top.
 *       Lenis-driven smooth scroll wraps the content.
 *
 *   prefers-reduced-motion: reduce
 *     → StaticFallback only. No Scene. No Lenis. Native scroll. Zero 3D.
 */
export function PortfolioShell({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  return (
    <>
      {/* Fixed backdrop — always mounted. Scene mounts over it when allowed. */}
      <div className="fixed inset-0 z-0">
        <StaticFallback />
        {!reduced && (
          <div className="absolute inset-0">
            <Scene />
          </div>
        )}
      </div>

      {/* Foreground — sections scroll over the fixed canvas */}
      <SmoothScrollProvider disabled={reduced}>
          <main className="relative z-10 pointer-events-none">
    <div className="pointer-events-auto">
      {children}
    </div>
  </main>
      </SmoothScrollProvider>
    </>
  );
}
