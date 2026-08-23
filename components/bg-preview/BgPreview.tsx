'use client';

import dynamic from 'next/dynamic';
import { useEffect, type CSSProperties } from 'react';

import { useSectionStore, previewUi } from '@/lib/section-store';
import { sections } from '@/data/sections';
import { clamp } from '@/lib/constants';

// Lazy-load the Scene exactly as PortfolioShell does (R3F touches window
// during setup, so it must never run during SSR/static prerender). The
// harness is background-agnostic — whatever background subject is on this
// branch renders, so future options can be previewed the same way.
const Scene = dynamic(() => import('@/components/three/Scene').then((m) => m.Scene), {
  ssr: false,
  loading: () => null,
});

const MIN_MULT = 0.1;
const MAX_MULT = 4;

const hudStyle: CSSProperties = {
  position: 'fixed',
  bottom: 16,
  right: 16,
  zIndex: 60,
  padding: '10px 14px',
  borderRadius: 6,
  background: 'rgba(7, 17, 24, 0.78)',
  border: '1px solid rgba(76, 155, 232, 0.28)',
  color: '#e2e8f0',
  fontFamily: 'var(--font-jetbrains), ui-monospace, SFMono-Regular, monospace',
  fontSize: 12,
  lineHeight: 1.65,
  letterSpacing: '0.02em',
  pointerEvents: 'none',
  userSelect: 'none',
};

/**
 * Dev-only /bg-preview harness. Renders the background full-bleed with no
 * content overlay so the art can be judged on its own, plus a minimal HUD
 * and keyboard controls that drive the section store exactly the way scroll
 * does (setSection flips section + phase targets → CameraRig dolls, the
 * flow field responds).
 *
 * Deterministic capture: `?section=N&intensity=X&speed=Y` applies on load.
 */
export function BgPreview() {
  const section = useSectionStore((s) => s.section);
  const ui = useSectionStore((s) => s.ui);
  const active = sections[section];

  // Apply URL params once on mount (client-only — static export can't read
  // searchParams server-side).
  useEffect(() => {
    const store = useSectionStore.getState();
    const params = new URLSearchParams(window.location.search);

    const rawSection = params.get('section');
    if (rawSection !== null) {
      const n = parseInt(rawSection, 10);
      if (Number.isFinite(n)) store.setSection(n);
    }

    const rawIntensity = params.get('intensity');
    if (rawIntensity !== null) {
      const v = parseFloat(rawIntensity);
      if (Number.isFinite(v)) store.setUi({ intensity: clamp(v, MIN_MULT, MAX_MULT) });
    }

    const rawSpeed = params.get('speed');
    if (rawSpeed !== null) {
      const v = parseFloat(rawSpeed);
      if (Number.isFinite(v)) store.setUi({ speed: clamp(v, MIN_MULT, MAX_MULT) });
    }
  }, []);

  // Keyboard controls. State is read fresh via getState() so the listener
  // never goes stale.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const store = useSectionStore.getState();
      const max = sections.length;

      const cycle = (dir: number) => {
        e.preventDefault();
        store.setSection(store.section + dir);
      };

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
        case ']':
        case ' ':
          cycle(1);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
        case '[':
          cycle(-1);
          break;
        default:
          if (/^[0-9]$/.test(e.key)) {
            const n = parseInt(e.key, 10);
            if (n >= 1 && n <= max) {
              e.preventDefault();
              store.setSection(n - 1);
            }
          } else if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            store.setUi({
              intensity: clamp(store.ui.intensity + 0.25, MIN_MULT, MAX_MULT),
            });
          } else if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            store.setUi({
              intensity: clamp(store.ui.intensity - 0.25, MIN_MULT, MAX_MULT),
            });
          } else if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            store.setSection(0);
            store.setUi({ intensity: 1, speed: 1 });
          }
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#091e26' }}>
      <Scene />

      {/* HUD — plain inline-styled divs, bottom corner, screenshot-friendly */}
      <div style={hudStyle}>
        <div style={{ color: '#67b4f9', fontWeight: 600 }}>BG PREVIEW — QA harness</div>
        <div>
          section: {String(section + 1).padStart(2, '0')} {active.label} ({section + 1}/{sections.length})
        </div>
        <div>
          intensity ×{ui.intensity.toFixed(2)} (eff ×{previewUi.intensity.toFixed(2)})
        </div>
        <div>speed ×{ui.speed.toFixed(2)} (eff ×{previewUi.speed.toFixed(2)})</div>
        <div style={{ color: '#93a8b2', marginTop: 2 }}>
          keys: ←/→ [ ] 1–{sections.length} space = section · +/- = intensity · r = reset
        </div>
        <div style={{ color: '#93a8b2' }}>url: ?section=N&amp;intensity=X&amp;speed=Y</div>
      </div>
    </div>
  );
}
