/**
 * GLSL for the flow-field background (Option B2).
 *
 * The core trick: particle positions are NOT stored/updated on the CPU or
 * in an FBO. Instead the vertex shader recomputes each particle's advected
 * position as a pure function of (home position, time) every frame — a few
 * fixed Euler substeps along a divergence-free 2D curl-noise field. The
 * result is a stateless, continuous function of time, so particles glide
 * along evolving streamlines with zero per-frame CPU cost and no state
 * management (good for 1000+ particles at 60fps).
 *
 * Section reactivity arrives as uniforms (damped in JS): uSpeed (firingRate
 * → advection strength), uTurbulence (stdpIntensity → curl chaos),
 * uReveal/uRevealAlpha (dendriteGrowth → global fade-in), uCharge
 * (spikeActive → brightness/size boost), uAccentMix (per-section color
 * drift cyan → mint). Depth fog is the same FogExp2 as the Scene, applied
 * as alpha attenuation so distant particles melt into the background.
 */

/** hash12 — hash of a 2D position in [0,1). */
const NOISE_GLSL = /* glsl */ `
  float hash12(vec2 p) {
    // NOTE: vec3(p.xy, 0.0) — GLSL ES 3.00 requires a full component set;
    // vec3(p.xy) fails to compile on three.js r168 (WebGL2-only) and
    // rendered the background blank. Caught by the vault bg-capture
    // pipeline (2026-08-06).
    vec3 p3 = fract(vec3(p.xy, 0.0) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // Divergence-free 2D flow from a scalar noise field (curl = rotated
  // gradient). Central-difference gradient keeps it cheap.
  vec2 curl2(vec2 p) {
    float e = 0.5;
    vec2 g = vec2(
      vnoise(p + vec2(e, 0.0)) - vnoise(p - vec2(e, 0.0)),
      vnoise(p + vec2(0.0, e)) - vnoise(p - vec2(0.0, e))
    ) * 0.5;
    return vec2(g.y, -g.x);
  }

  // FBM-ish curl: incommensurate frequencies + time offsets kill any
  // visible periodicity. The detail octaves scale with turbulence.
  vec2 curlFlow(vec2 p, float turb, float speed) {
    vec2 v = curl2(p * uFreq + vec2(uTime * 0.22, uTime * -0.13) * speed);
    v += curl2(p * uFreq * 2.7 + vec2(19.7, 7.3) + vec2(uTime * 0.35, uTime * 0.21) * speed) * (0.55 * turb);
    v += curl2(p * uFreq * 7.3 - vec2(11.3, 29.1) - vec2(uTime * 0.17, uTime * -0.25) * speed) * (0.28 * turb * turb);
    return v;
  }

  // Soft radial clamp so particles never drift far from home (prevents
  // clumping into the center and keeps the shell shape).
  vec3 softClamp(vec3 d, float m) {
    float l = length(d) + 1e-6;
    return d * (m / (m + l));
  }
`;

export const flowFieldVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;        // advection strength (firingRate)
  uniform float uTurbulence;   // curl chaos (stdpIntensity)
  uniform float uFreq;         // base curl frequency (world units)
  uniform float uStep;         // per-substep displacement (speed * 0.2)
  uniform float uWander;       // max displacement from home
  uniform vec3  uHalf;         // world half-extents of the home shell
  uniform float uScale;        // drawingBufferHeight * 0.5 (point sizing)
  uniform float uSize;         // base point size (world units)
  uniform float uReveal;       // 0..1 global reveal (dendriteGrowth)
  uniform float uCharge;       // 0..1 brightness/size boost (spikeActive)
  uniform float uFogDensity;   // FogExp2 density (matches Scene)
  uniform float uCenterFadeStart;
  uniform float uCenterFadeEnd;

  attribute vec3 aHome;
  attribute vec4 aSeed;
  attribute vec3 aColor;

  varying vec3  vColor;
  varying float vBright;
  varying float vFog;

  ${NOISE_GLSL}

  void main() {
    // Map normalized home onto the live frustum half-extents.
    vec3 home = aHome * uHalf;

    // Stateless advection: a few Euler substeps along the curl field,
    // recomputed from home every frame (smooth function of time).
    vec3 p = home;
    for (int i = 0; i < 4; i++) {
      vec2 flow = curlFlow(p.xy, uTurbulence, uSpeed);
      p.xy += flow * uStep * (0.8 + 0.4 * aSeed.w);
      p.z += (vnoise(p.xz * 1.3 + uTime * 0.28 * uSpeed) - 0.5) * uStep * 0.7;
    }
    p = home + softClamp(p - home, uWander);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    // Point size, PointsMaterial-equivalent (world size * screen scale).
    float size = uSize * aSeed.y * (0.85 + 0.5 * uCharge);
    gl_PointSize = clamp(size * (uScale / -mv.z), 0.5, 26.0);

    // Per-particle brightness: base * twinkle * reveal * charge.
    float twinkle = 0.7 + 0.3 * sin(uTime * (0.6 + aSeed.x * 1.6) + aSeed.z * 6.2831);
    vBright = aSeed.w * twinkle * (0.55 + 0.6 * uReveal) * (0.62 + 0.38 * uCharge);
    vBright *= 0.85;

    // FogExp2 as alpha attenuation (distant particles melt into the bg).
    float dist = length(mv.xyz);
    vFog = exp(-pow(dist * uFogDensity, 2.0));

    // Center-clearance: particles near the view axis stay dim so the
    // content corridor reads clearly.
    float vr = length(mv.xy);
    vFog *= smoothstep(uCenterFadeStart, uCenterFadeEnd, vr);

    vColor = aColor;
  }
`;

export const flowFieldFragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3  uAccentColor;
  uniform float uAccentMix;    // 0..1 per-section drift toward mint
  uniform float uRevealAlpha;  // extra alpha gate for the reveal envelope

  varying vec3  vColor;
  varying float vBright;
  varying float vFog;

  void main() {
    // Soft round sprite (bright core, smooth falloff) for additive glow.
    float d = length(gl_PointCoord - 0.5);
    float a = 1.0 - smoothstep(0.0, 0.5, d);
    a = a * a;

    vec3 col = mix(vColor, uAccentColor, uAccentMix * 0.3);
    col *= vBright;

    float alpha = a * vFog * uRevealAlpha;
    gl_FragColor = vec4(col, alpha);
  }
`;
