/**
 * Firing-wave background data model (Option B3).
 *
 * The neuroscience metaphor abstracted into *signal*: concentric wavefronts
 * that radiate from per-section "firing centers" like ripples on water — or
 * an oscilloscope trace of a neuron firing. Rings are rendered as crisp SDF
 * gaussians by a fullscreen camera-facing plane (components/three/FiringWave.tsx
 * + lib/firing-wave-shaders.ts); this module owns the *simulation* side.
 *
 * Design:
 *  - Every section owns one off-center focal point (WAVE_CENTERS). All six
 *    centers emit gentle ambient rings at staggered cadences so the whole
 *    canvas always has subtle motion and no dead zone forms (the center is
 *    crossed by rings from the surrounding foci — negative space, not a hole).
 *  - The ACTIVE section's center emits brighter, faster rings whose color
 *    drifts cyan → mint with the section index.
 *  - `spikeActive` fires "action potentials": a bright, fast, quickly-decaying
 *    ring bursts from the active center (on the rising edge, and periodically
 *    while the level stays high) — spike = AP, the semantic payoff.
 *
 * Waves are events: { center, birth, growth, maxRadius, brightness, mix,
 * thickness }. A ring buffer (MAX_WAVES) is packed every frame into a
 * 2-texel-per-wave RGBA Float DataTexture (texel A = center/birth/growth,
 * texel B = maxRadius/brightness/mix/thickness) which the fragment shader
 * samples in a fixed loop. Dead slots carry brightness 0 and are skipped
 * with an early `continue`, so the per-pixel cost stays near the live count.
 */

/** Max simultaneous wavefronts. Desktop / mobile (mobile passes a lower cap). */
export const MAX_WAVES = 32;
export const MAX_WAVES_MOBILE = 20;

/** Floats per wave in the packed texture (2 RGBA texels). */
export const WAVE_FLOATS = 8;

export interface WaveCenter {
  /** Normalized position on the frustum plane in [±1] — mapped to uHalf each frame. */
  nx: number;
  ny: number;
  /** Base ambient emission interval in seconds (staggered + jittered). */
  ambientInterval: number;
  /** Base cyan(0) → mint(1) tint for this center's ambient rings. */
  tint: number;
}

/**
 * One focal point per portfolio section. Positions are deliberately
 * off-center and scattered (upper-right, lower-left, lower-right, upper-left,
 * upper-center, lower-center) so the union of the six ripple fields covers
 * the canvas with no large empty void, and rings from the four quadrant foci
 * cross the view axis at low density — the center reads as intentional
 * negative space, not a hole.
 */
export const WAVE_CENTERS: WaveCenter[] = [
  { nx: 0.62, ny: 0.34, ambientInterval: 2.7, tint: 0.0 }, // 00 hero
  { nx: -0.6, ny: -0.3, ambientInterval: 2.3, tint: 0.12 }, // 01 about
  { nx: 0.55, ny: -0.52, ambientInterval: 3.0, tint: 0.28 }, // 02 projects
  { nx: -0.62, ny: 0.46, ambientInterval: 2.5, tint: 0.4 }, // 03 research
  { nx: 0.18, ny: 0.64, ambientInterval: 2.85, tint: 0.58 }, // 04 github
  { nx: -0.24, ny: -0.66, ambientInterval: 3.2, tint: 0.72 }, // 05 contact
];

export interface Wave {
  /** Index into WAVE_CENTERS. */
  center: number;
  /** Simulation time (seconds) at emission. */
  birth: number;
  /** Radius expansion speed in world units / second. */
  growth: number;
  /** Radius (world units) at which the ring is fully faded. */
  maxRadius: number;
  /** Additive brightness (AP exceeds 1 → crosses the bloom threshold). */
  brightness: number;
  /** 0 cyan → 1 mint per-ring color mix. */
  mix: number;
  /** Ring half-width in world units (crispness knob). */
  thickness: number;
}

export interface UpdateParams {
  firingRate: number;
  section: number;
  spikeActive: number;
  speedMult: number;
  accent: number;
  mobile: boolean;
}

/** Deterministic PRNG so emission cadences are stable across mounts. */
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
 * Simulation state for the firing-wave field. Instantiated once per mount
 * (component keeps it in a ref), updated every frame from useFrame, and
 * packed into the shader's DataTexture via `pack()`.
 */
export class FiringWaveSystem {
  simTime = 0;
  waves: Wave[] = [];

  /** Public + mutable: useIsMobile flips after first paint. */
  mobile = false;

  private readonly rand: () => number;
  private readonly ambientTimers: number[];
  private activeTimer = 0;
  private apTimer = 0;

  constructor(mobile = false, seed = 20260807) {
    this.mobile = mobile;
    this.rand = mulberry32(seed);
    // Stagger ambient emission so the six foci never fire in unison.
    this.ambientTimers = WAVE_CENTERS.map(
      (c, i) => ((i * 0.37 + 0.13) * c.ambientInterval) % c.ambientInterval,
    );
  }

  /** Seed a calm static field (used for the initial frame + reduced motion). */
  seedAmbient(count = 14) {
    this.waves = [];
    for (let i = 0; i < count; i++) {
      const wave = this.makeAmbientWave(i % WAVE_CENTERS.length);
      // Births in the past → rings already mid-expansion at t=0.
      wave.birth = -this.rand() * 4.5;
      this.waves.push(wave);
    }
  }

  /**
   * Advance the simulation. `dt` is raw frame time; interval timers consume
   * `dt * speedMult` so the preview harness's speed multiplier accelerates
   * emission as well as expansion.
   */
  update(dt: number, params: UpdateParams) {
    this.simTime += dt;
    const dts = dt * params.speedMult;
    const intervalScale = this.mobile ? 1.4 : 1;

    // Ambient: every center keeps the canvas alive (no dead zones).
    for (let i = 0; i < WAVE_CENTERS.length; i++) {
      this.ambientTimers[i] -= dts;
      if (this.ambientTimers[i] <= 0) {
        this.push(this.makeAmbientWave(i));
        const base = WAVE_CENTERS[i].ambientInterval * intervalScale;
        this.ambientTimers[i] = base * (0.72 + this.rand() * 0.56);
      }
    }

    // Active: the current section's focus fires faster and brighter.
    this.activeTimer -= dts;
    if (this.activeTimer <= 0) {
      this.push(this.makeActiveWave(params.section, params.accent, params.firingRate));
      this.activeTimer = (1.9 - 1.3 * params.firingRate) * intervalScale;
    }

    // Action potentials: while the spike level is high, the active focus
    // periodically fires a bright, fast, short-lived AP ring.
    if (params.spikeActive >= 0.5) {
      this.apTimer -= dts;
      if (this.apTimer <= 0) {
        this.fireSpike(params.section, params.accent, params.firingRate);
        this.apTimer = (2.7 - 1.8 * params.firingRate) * intervalScale;
      }
    }

    // Expire grown-out rings (lifetime = time to reach maxRadius + tail).
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      const lifetime = w.maxRadius / Math.max(0.001, w.growth) + 0.7;
      if (this.simTime - w.birth > lifetime) this.waves.splice(i, 1);
    }
  }

  /** One-shot action potential: bright fast ring + (caller sets the glow). */
  fireSpike(section: number, accent: number, firingRate: number) {
    this.push({
      center: section,
      birth: this.simTime,
      growth: 2.3 + 0.9 * firingRate,
      maxRadius: 4.4,
      brightness: (this.mobile ? 1.5 : 1.9) * (0.85 + 0.3 * firingRate),
      mix: accent,
      thickness: this.mobile ? 0.055 : 0.06,
    });
  }

  /**
   * Pack the live waves into `out` (a Float32Array of MAX_WAVES * WAVE_FLOATS)
   * in texture row order. `half` is the current frustum half-extent in world
   * units; normalized centers map to world positions so foci stay glued to
   * their screen position across the camera dolly. Dead slots are zeroed
   * (brightness 0 → shader skips them).
   */
  pack(out: Float32Array, half: { x: number; y: number }) {
    out.fill(0);
    const n = Math.min(this.waves.length, out.length / WAVE_FLOATS);
    for (let i = 0; i < n; i++) {
      const w = this.waves[i];
      const c = WAVE_CENTERS[w.center];
      const o = i * WAVE_FLOATS;
      out[o] = c.nx * half.x;
      out[o + 1] = c.ny * half.y;
      out[o + 2] = w.birth;
      out[o + 3] = w.growth;
      out[o + 4] = w.maxRadius;
      out[o + 5] = w.brightness;
      out[o + 6] = w.mix;
      out[o + 7] = w.thickness;
    }
  }

  private makeAmbientWave(center: number): Wave {
    const c = WAVE_CENTERS[center];
    const dim = this.mobile ? 0.8 : 1;
    return {
      center,
      birth: this.simTime,
      growth: 0.5 + this.rand() * 0.22,
      maxRadius: 4.3 + this.rand() * 1.6,
      brightness: (0.28 + this.rand() * 0.18) * dim,
      mix: c.tint,
      thickness: 0.028 + this.rand() * 0.02,
    };
  }

  private makeActiveWave(section: number, accent: number, firingRate: number): Wave {
    const dim = this.mobile ? 0.8 : 1;
    return {
      center: section,
      birth: this.simTime,
      growth: 0.7 + 0.5 * firingRate,
      maxRadius: 5.4,
      brightness: 0.92 * dim,
      mix: accent,
      thickness: this.mobile ? 0.03 : 0.035,
    };
  }

  private push(wave: Wave) {
    const cap = this.mobile ? MAX_WAVES_MOBILE : MAX_WAVES;
    if (this.waves.length >= cap) this.waves.shift();
    this.waves.push(wave);
  }
}
