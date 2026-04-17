/**
 * Constants shared between React UI and Three.js scenes.
 * Keep the palette in sync with tailwind.config.ts.
 */

export const COLORS = {
  bg: '#0a0e1a',
  bgDeep: '#05080f',
  cyan: '#22d3ee',
  cyanGlow: '#67e8f9',
  cyanDeep: '#0891b2',
  mint: '#34d399',
  mintGlow: '#6ee7b7',
  mintDeep: '#059669',
  text: '#f1f5f9',
  textSoft: '#94a3b8',
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
