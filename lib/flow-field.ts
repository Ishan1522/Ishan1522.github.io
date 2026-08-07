/**
 * Flow-field particle data generator (background Option B2).
 *
 * Produces the per-particle attributes for the curl-noise flow field:
 * a home position in an organic cloud, a packed seed vec4 (twinkle
 * phase, size variance, color pick, speed variance) and a base palette
 * color. The renderer (components/three/FlowField.tsx) advects each
 * particle around its home in the vertex shader using a curl-noise
 * vector field, so nothing here is touched per-frame.
 *
 * Homes form an irregular blob, not a geometric oval: a soft outward
 * density ramp (small inner cutoff so the middle stays *relatively*
 * clear for content but is never an empty void), per-particle y-squish
 * variance, a wider z-spread, and radial jitter on the boundary. ~7% of
 * particles are scattered into the inner region and dimmed so the
 * center reads as hazy texture, not a dead hole. Deterministic seeding
 * (mulberry32) keeps the cloud identical across re-mounts.
 */

export interface ParticleData {
  count: number;
  /** Home positions, one vec3 per particle. Pre-scale of [±1]; the
   *  renderer maps these to the actual frustum half-extents per frame. */
  positions: Float32Array;
  /** Packed vec4 per particle: x=twinkle phase, y=size variance,
   *  z=color pick, w=speed variance. */
  seeds: Float32Array;
  /** Base palette color (vec3), already dimmed toward background level. */
  colors: Float32Array;
}

/** Deterministic PRNG so the field is identical across renders/mounts. */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build particle attributes for the flow field.
 *
 * @param count  Number of particles (mobile builds pass a lower count).
 * @param seed   Deterministic seed (stable across builds).
 */
export function buildParticleData(count: number, seed = 20260806): ParticleData {
  const rand = mulberry32(seed);

  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);

  // Palette anchors (0-1 RGB).
  const cyan = [0x22 / 255, 0xd3 / 255, 0xee / 255];
  const mint = [0x34 / 255, 0xd3 / 255, 0x99 / 255];
  const cyanDeep = [0x08 / 255, 0x91 / 255, 0xb2 / 255];

  for (let i = 0; i < count; i++) {
    // Home: an organic cloud instead of a hard annulus. The radial
    // density ramps outward (pow 0.75 ≈ mild outward bias, nowhere near
    // the old 0.34 inner cutoff) so the silhouette is a filled blob, and
    // the per-particle y-squish variance + wider z-spread + radial edge
    // jitter break the perfect ellipse. ~7% of particles are strays
    // scattered into the inner region and dimmed below (color pass) so
    // the middle never reads as a dead void.
    const stray = rand() < 0.07;
    const baseR = stray ? rand() * 0.3 : 0.08 + Math.pow(rand(), 0.75) * 0.85;
    const rJitter = 0.92 + rand() * 0.16; // irregular boundary (0.92..1.08)
    const r = baseR * rJitter;
    const a = rand() * Math.PI * 2;
    const squish = 0.75 + rand() * 0.45; // per-particle y-squish (0.75..1.2)
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = Math.sin(a) * r * squish;
    positions[i * 3 + 2] = (rand() - 0.5) * 1.2;

    // Packed seed vec4.
    seeds[i * 4] = rand(); // twinkle phase
    seeds[i * 4 + 1] = 0.68 + rand() * 0.72; // size variance (0.68..1.4)
    seeds[i * 4 + 2] = rand(); // color pick
    seeds[i * 4 + 3] = 0.72 + rand() * 0.62; // speed variance (0.72..1.34)

    // Base color: ~50% cyan, ~25% mint, ~25% deep cyan, dimmed. Inner
    // strays get extra dimming so the content corridor still reads.
    const pick = rand();
    const base = pick < 0.5 ? cyan : pick < 0.75 ? mint : cyanDeep;
    const dim = (0.5 + rand() * 0.42) * (stray ? 0.55 : 1);
    colors[i * 3] = base[0] * dim;
    colors[i * 3 + 1] = base[1] * dim;
    colors[i * 3 + 2] = base[2] * dim;
  }

  return { count, positions, seeds, colors };
}
