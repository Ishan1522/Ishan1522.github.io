/**
 * Constants shared between React UI and Three.js scenes.
 *
 * Color source of truth: the CSS custom properties in `app/globals.css`
 * (`:root`), consumed by tailwind.config.ts as `rgb(var(--color-*) ...)`.
 * This COLORS map is the WebGL-layer mirror of that palette. The Three.js
 * shaders need synchronous hex values at module scope (getComputedStyle is
 * not available during SSR / first client render), so we keep the hex here
 * and keep it in sync with globals.css by hand. Each key maps to its
 * `--color-*` variable:
 *
 *   bg        → --color-ink-900
 *   bgDeep    → --color-ink-950
 *   cyan      → --color-cyan      (blue)
 *   cyanGlow  → --color-cyan-glow
 *   cyanDeep  → --color-cyan-deep
 *   mint      → --color-mint      (indigo)
 *   mintGlow  → --color-mint-glow
 *   mintDeep  → --color-mint-deep
 *   text      → --color-slate-bright
 *   textSoft  → --color-slate-soft
 */
export const COLORS = {
  bg: '#090c16',      // ink-900 — near-black navy
  bgDeep: '#060810',  // ink-950
  cyan: '#5a94ff',    // blue
  cyanGlow: '#85b2ff',
  cyanDeep: '#2563eb',
  mint: '#5b6cff',    // indigo-blue (token name kept — see globals.css)
  mintGlow: '#8f9bff',
  mintDeep: '#3b46e0',
  text: '#f4f6fc',    // slate-bright
  textSoft: '#9aa4bb',// slate-soft
} as const;

/** Convert a #rrggbb hex to a 0-1 THREE.Color-compatible tuple. */
export function hexToRGB(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [r, g, b];
}

export const MOBILE_BREAKPOINT = 768;

/** Clamp value to [min, max]. */
export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Exponential smoothing — frame-rate-independent damp toward target. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/** Map x from [inMin, inMax] to [outMin, outMax], clamped. */
export function remap(x: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  const t = clamp((x - inMin) / (inMax - inMin), 0, 1);
  return outMin + (outMax - outMin) * t;
}
