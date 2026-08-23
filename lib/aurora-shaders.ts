/**
 * GLSL for the aurora background (Option B4 — "Aurora gradient layers").
 *
 * The scene is one large camera-facing plane at z ≈ -0.4 whose fragment
 * shader paints 2-4 layered "curtain" bands of fbm/value noise with domain
 * warping — the silky folded-curtain look of northern-lights ribbons. Pure
 * procedural: no particles, no geometry per band, no textures, no CPU sim.
 * Additive blending + toneMapped:false (same pass style as the prior
 * backgrounds). The field is the site's signature — the dominant volumetric
 * petrol void the layout sits inside — so curtain weights and edge fade are
 * tuned to fill the frame and read as material, with soft bloom on the
 * curtain cores (Effects.tsx) rather than a dim backdrop behind cards.
 *
 * Full-bleed robustness: the plane is 24×24 units — always larger than the
 * frustum at any camera Z the rig can reach — and the vertex shader passes
 * the world XY of the plane to the fragment. The fragment divides by the
 * live frustum half-extents (uHalfW / uHalfH, computed in Aurora.tsx from
 * the current camera Z), which maps the *visible* portion of the plane to
 * NDC [-1, 1]. The field therefore always fills the viewport exactly,
 * regardless of the camera dolly — and the edge fade, being computed in
 * that same screen-fixed NDC, stays aligned with the viewport edge.
 *
 * Curtain technique (per band):
 *   - A shared 2-stage domain-warp basis (iq-style: q = fbm(p), then
 *     r = fbm(p + 3.5·q + offset)) is computed once per fragment — every
 *     band reuses it with a per-band seed/scale decorrelation, so the fold
 *     texture differs per band while the warp cost is paid only once.
 *   - Each band's centerline is a warped-fbm sample along the horizontal
 *     sweep; the cross-section is a soft gaussian (no hard edges).
 *   - A second warped sample modulates intensity along the curtain —
 *     folds, breaks, density.
 *   - Bands have staggered phase seeds and incommensurate drift multipliers
 *     (0.53 / 0.87 / 1.31 — no common period), so the ribbons never sync up.
 *
 * Reactivity (damped in JS, see Aurora.tsx):
 *   section        → uAccentMix, cyan → mint drift (the field breathes)
 *   firingRate     → uFlow, scales the drift clock speed
 *   dendriteGrowth → uGlobalAlpha reveal envelope (fade-in on load)
 *   rotation       → uSpin, very slow rotational drift of the whole field
 *   spikeActive    → uPulse, faint slow brightness swell (not a burst)
 *   stdpIntensity  → uShimmer, whisper of brightness lift (subtle life)
 *   previewUi      → uSpeed × uFlow drives the clock; intensity scales the
 *                    envelope via uGlobalAlpha (set in Aurora.tsx)
 *
 * Banding: the gradients are smooth 32-bit fbm; a 1-bit hash dither is
 * added just before output to kill any residual 8-bit banding.
 */

export const auroraVertexShader = /* glsl */ `
  varying vec2 vWorld;

  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xy;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

/**
 * Build the fragment shader with the desired fbm octave count baked in.
 *
 * Lamp tuning (pointer-following glow) is baked here too, defaulting to the
 * constants in Aurora.tsx so there is one source of truth:
 *   lampLift  — max relative brightness lift at the cursor (~10-18%)
 *   lampWarm  — how warm the lifted light reads (0 = white, 1 = strongly amber)
 *   lampSigma — lamp pool radius in NDC units (~0.35-0.5 of the half-extent)
 */
export function buildAuroraFragmentShader(
  octaves = 4,
  lampLift = 0.14,
  lampWarm = 0.25,
  lampSigma = 0.42,
): string {
  return /* glsl */ `
    precision highp float;

    uniform float uTime;         // drift clock (frozen under reduced motion)
    uniform float uSpeed;        // previewUi.speed multiplier
    uniform float uFlow;         // firingRate-driven drift (0.5 calm → 1.06)
    uniform float uShimmer;      // stdpIntensity brightness lift
    uniform float uSpin;         // damped rotational drift (rotation)
    uniform float uPulse;        // damped spikeActive — faint swell
    uniform float uAccentMix;    // 0..1 section accent cyan → mint
    uniform float uGlobalAlpha;  // reveal envelope × intensity × mobile dim
    uniform float uHalfW;        // live frustum half-width at the plane
    uniform float uHalfH;        // live frustum half-height at the plane
    uniform vec3  uCyan;
    uniform vec3  uMint;
    uniform vec3  uPetrol;       // deep petrol — the dominant volumetric base
    uniform vec2  uMouse;        // pointer lamp — cursor NDC on the visible rect
    uniform float uLampStrength; // 1 normal, 0.5 reduced-motion (gentler)

    varying vec2 vWorld;

    // ---- hash / value noise (pure math — no textures) --------------------
    float hash21(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    // ${octaves}-octave fbm, rotation-decorrelated per octave.
    // Returns roughly [0, ~0.94], mean ~0.47.
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < ${octaves}; i++) {
        v += a * vnoise(p);
        p = mat2(1.6, 1.2, -1.2, 1.6) * p;
        a *= 0.5;
      }
      return v;
    }

    // ---- one curtain band -------------------------------------------------
    // p      : rotated visible-NDC sampling position
    // rBasis : shared 2nd-stage warp vectors from the fragment main
    // seed   : per-band phase stagger (differs hue + fold shape)
    // mult   : incommensurate drift multiplier (0.53 / 0.87 / 1.31)
    // baseY  : resting centerline height (NDC, screen-fixed)
    // thick  : soft gaussian band thickness (NDC)
    // t      : drift time (uTime * uFlow * uSpeed)
    float curtain(vec2 p, vec2 rBasis, float seed, float mult, float baseY, float thick, float t) {
      // Horizontal sweep with per-band phase + slow drift.
      vec2 xs = vec2(p.x * 1.25 + seed * 2.1, t * mult + seed * 6.7);

      // Decorrelate the shared warp basis for this band — same warp field,
      // different sampling offsets/scales, so folds differ per curtain.
      vec2 rw = rBasis * vec2(1.0 + 0.22 * seed, 1.0 - 0.18 * seed) + vec2(seed, seed * 1.9);

      // Centerline wanders along the curtain (silky folds).
      float w = fbm(xs + 3.2 * rw);
      float cy = baseY + (w - 0.5) * 1.15;

      // Soft gaussian cross-section — no hard edges.
      float band = exp(-pow((p.y - cy) / thick, 2.0));

      // Folds / breaks along the curtain (second warped sample).
      float fold = fbm(xs * 1.7 + 3.6 * rw.yx + vec2(seed * 3.9, seed));
      float density = 0.30 + 0.70 * fold;

      return band * density;
    }

    void main() {
      // Screen-fixed visible NDC: vWorld spans the whole (oversized) plane,
      // but dividing by the live half-extents maps exactly the visible rect
      // to [-1, 1] — full-bleed at any camera Z, and the edge fade below
      // stays glued to the viewport edge.
      vec2 p0 = vWorld / vec2(uHalfW, uHalfH);

      // Very slow rotational drift of the whole field (store rotation).
      float cs = cos(uSpin);
      float sn = sin(uSpin);
      vec2 p = vec2(p0.x * cs - p0.y * sn, p0.x * sn + p0.y * cs);

      // Drift clock: firingRate scales uFlow, harness speed scales uSpeed.
      float t = uTime * uFlow * uSpeed;

      // Shared 2-stage domain-warp basis — computed once per fragment.
      vec2 q = vec2(fbm(p + vec2(0.0, 0.0)), fbm(p + vec2(5.2, 1.3)));
      vec2 r = vec2(fbm(p + 3.5 * q + vec2(1.7, 9.2)), fbm(p + 3.5 * q + vec2(8.3, 2.8)));
      float wbase = fbm(p + 3.0 * r);

      // Three curtain bands — phase-staggered, incommensurate drift.
      float c0 = curtain(p, r, 0.0, 0.53, -0.12, 0.34, t);
      float c1 = curtain(p, r, 5.3, 0.87,  0.14, 0.22, t);
      float c2 = curtain(p, r, 9.7, 1.31,  0.42, 0.14, t);

      // Curtain colors: deep petrol base sheet → blue → green, with a gentle
      // blue → green drift per section (uAccentMix). Blue stays dominant —
      // the base sheet and the lower curtain carry the field's weight.
      vec3 cyan = mix(uCyan, uMint, 0.20 + 0.50 * uAccentMix);
      vec3 mint = mix(uCyan, uMint, 0.50 + 0.50 * uAccentMix);

      // Curtain weights raised so the field reads as the dominant material:
      // the petrol base sheet + blue curtain carry most of the presence,
      // green curtain adds the live-signal top note.
      vec3 col = uPetrol * (c0 * 0.16)
               + cyan    * (c1 * 0.22)
               + mint    * (c2 * 0.17);

      // Full-field haze — the petrol → blue continuum reads everywhere, so
      // the curtains float in a material volume rather than a void.
      col += mix(uPetrol, uCyan, wbase * 0.60) * 0.075 * (0.85 + 0.45 * uAccentMix);

      // stdpIntensity shimmer — a whisper of brightness, subtle life.
      col *= 0.88 + 0.12 * uShimmer;

      // spikeActive — faint, slow brightness swell (breathing, NOT a burst).
      col *= 1.0 + uPulse * 0.25 * (0.5 + 0.5 * sin(t * 0.55 + wbase * 6.28318));

      // Pointer lamp — a soft warm pool of light that follows the cursor,
      // like moving a warm lamp over fog. Computed in the same screen-fixed
      // NDC space as p0 (uMouse arrives as NDC), so the pool is a true
      // circle on screen regardless of aspect / camera dolly. exp falloff
      // with a big radius (σ ≈ 0.42 of the half-extent); the lift is
      // RELATIVE (multiplies the local color) and hard-clamped, so at the
      // cursor brightness rises by at most lampLift (~14%) and fades to
      // nothing at the pool edge. A faint warm cast makes it read as
      // *light*, not a spotlight. Scaled by uLampStrength (reduced-motion
      // gentler) and by uGlobalAlpha/edge via the final output multiply.
      {
        vec2 lampD = p0 - uMouse;
        float lampGlow = exp(-dot(lampD, lampD) / (${lampSigma.toFixed(4)} * ${lampSigma.toFixed(4)}));
        lampGlow = min(lampGlow, 1.0);
        float lift = lampGlow * ${lampLift} * uLampStrength;
        lift = min(lift, ${lampLift}); // hard clamp — never a flash
        vec3 warmTint = vec3(1.0, 1.0 - ${lampWarm} * 0.5, 1.0 - ${lampWarm});
        col *= 1.0 + lift * warmTint;
      }

      // Edge fade — curtains melt into the corners (vignette-consistent;
      // Effects.tsx adds its own vignette on desktop on top of this). Fade
      // starts late so the field bleeds well into the frame — the layout
      // sits inside the void, it doesn't look onto a window.
      float radial = length(p0);
      float edge = 1.0 - smoothstep(0.95, 1.6, radial);

      // 1-bit hash dither — kills residual 8-bit banding in the gradients.
      col += (hash21(gl_FragCoord.xy) - 0.5) * 0.006;

      gl_FragColor = vec4(col * (uGlobalAlpha * edge), 1.0);
    }
  `;
}
