'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, type ReactNode } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SmoothScrollProvider } from './providers/SmoothScrollProvider';
import { StaticFallback } from './three/StaticFallback';

// Lazy-load the Scene so the WebGL bundle isn't in the initial JS payload.
// ssr: false because R3F touches window during setup.
const Scene = dynamic(() => import('./three/Scene').then((m) => m.Scene), {
  ssr: false,
  loading: () => null,
});

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * True once it's reasonable to start the WebGL bundle: after the page has
 * loaded and the main thread is idle, so content is readable and tappable
 * first. Never true on data-saver or 2G connections — those keep the static
 * backdrop and skip ~300 KB of three.js entirely.
 */
function useSceneReady(disabled: boolean): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (disabled) return;
    const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (conn?.saveData || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') return;

    let cancelled = false;
    let idleId: number | undefined;
    const start = () => {
      if (cancelled) return;
      const go = () => !cancelled && setReady(true);
      if (typeof window.requestIdleCallback === 'function') idleId = window.requestIdleCallback(go, { timeout: 2500 });
      else idleId = window.setTimeout(go, 300);
    };

    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', start);
      if (idleId !== undefined) {
        if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId);
        else window.clearTimeout(idleId);
      }
    };
  }, [disabled]);

  return ready;
}

/**
 * Orchestrates the two rendering modes:
 *
 *   Default: full-motion
 *     → StaticFallback is rendered as the first paint; <Scene> mounts on top
 *       (fading in) once the page has loaded and the browser is idle.
 *       Lenis-driven smooth scroll wraps the content.
 *
 *   prefers-reduced-motion: reduce
 *     → StaticFallback only. No Scene. No Lenis. Native scroll. Zero 3D.
 */
export function PortfolioShell({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const sceneReady = useSceneReady(reduced);

  return (
    <>
      {/* Fixed backdrop — always mounted. Scene mounts over it when allowed. */}
      <div className="fixed inset-0 z-0">
        <StaticFallback />
        {!reduced && sceneReady && (
          <div className="absolute inset-0 animate-fade-in">
            <Scene />
          </div>
        )}
      </div>

      {/* Foreground — sections scroll over the fixed canvas */}
      <SmoothScrollProvider disabled={reduced}>
          <main className="relative z-10 pointer-events-none">
      {children}
  </main>
      </SmoothScrollProvider>
    </>
  );
}
