/**
 * GLSL for the firing-wave background (Option B3).
 *
 * The scene is one camera-facing plane at z≈0 whose fragment shader paints
 * everything: crisp SDF ring wavefronts sampled from the wave DataTexture,
 * two faint traveling "oscilloscope" traces (EEG garnish), and dim ember
 * glows at the six focal centers. Additive blending + toneMapped:false so
 * bright wavefronts (action potentials) cross the Bloom threshold in
 * Effects.tsx while everything else stays below it.
 *
 * Why a fragment plane instead of point sprites: rings are radial SDF
 * gaussians — analytically crisp at any radius, no point-size clamp, and the
 * whole field costs one textured quad. Depth fog (Scene's FogExp2) is a
 * no-op here because a camera-facing plane has constant depth; the envelope
 * (uGlobalAlpha), edge fade, and gentle center attenuation do the
 * "dimmer than content" work instead.
 *
 * Reactivity (damped in JS, see FiringWave.tsx):
 *   firingRate    → emission rate + expansion speed (wave data, CPU side)
 *   stdpIntensity → uStdp, the EEG trace amplitude
 *   dendriteGrowth→ uGlobalAlpha reveal envelope
 *   spikeActive   → AP rings (CPU) + uSpikeGlow flash around uActiveCenter
 *   section index → uAccentMix cyan → mint drift + active focus
 *   rotation      → uTilt, a slow sway of the ring field (traces stay glass-fixed)
 */

import { MAX_WAVES, WAVE_CENTERS } from './firing-wave';

export const firingWaveVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Build the fragment shader with the live wave-array size baked in. */
export function buildFiringWaveFragmentShader(): string {
  const waveCount = MAX_WAVES;
  const centerCount = WAVE_CENTERS.length;

  return /* glsl */ `
    precision highp float;

    uniform float uTime;         // simulation time (frozen under reduced motion)
    uniform float uSpeed;        // previewUi.speed — expansion + trace sweep
    uniform float uGlobalAlpha;  // reveal envelope × intensity (dendriteGrowth)
    uniform float uAccentMix;    // 0..1 section accent drift cyan → mint
    uniform float uStdp;         // 0..1 EEG trace activity (stdpIntensity)
    uniform float uTilt;         // damped sway of the ring field (rotation)
    uniform float uHalfW;        // current frustum half-width (world units)
    uniform float uHalfH;        // current frustum half-height
    uniform vec2  uActiveCenter; // active focus, world space (spike glow/ember)
    uniform float uActiveBright; // active ember boost (reveal-scaled)
    uniform float uSpikeGlow;    // 0..1 decaying AP flash
    uniform vec3  uCyan;
    uniform vec3  uMint;
    uniform sampler2D uWavesTex; // 2-texel-per-wave RGBA float texture
    uniform vec2  uCenters[${centerCount}];   // focal points (normalized [±1])
    uniform float uCenterTints[${centerCount}]; // per-center cyan → mint tint

    varying vec2 vUv;

    // Rotate a vector by the sway angle (passed in to avoid globals).
    vec2 rotV(vec2 v, float tc, float ts) {
      return vec2(v.x * tc - v.y * ts, v.x * ts + v.y * tc);
    }

    void main() {
      // World position on the frustum plane. vUv always spans the visible
      // rect (the shader remaps UV→world via the live half-extents), so
      // waves stay glued to their screen position across the camera dolly.
      vec2 p = (vUv * 2.0 - 1.0) * vec2(uHalfW, uHalfH);

      // Slow sway: rotate the ring field about the view axis. The ring
      // positions AND the focal embers/spike glow share this rotation so
      // wave origins stay glued to their embers. Traces below use the
      // un-rotated screen space — they are instrument glass.
      float tc = cos(uTilt);
      float ts = sin(uTilt);
      vec2 pr = rotV(p, tc, ts);

      // ---- Wavefront rings (the hero) ------------------------------------
      vec3 ringCol = vec3(0.0);
      for (int i = 0; i < ${waveCount}; i++) {
        float y = (float(i) + 0.5) / ${waveCount}.0;
        vec4 wa = texture2D(uWavesTex, vec2(0.25, y)); // cx, cy, birth, growth
        vec4 wb = texture2D(uWavesTex, vec2(0.75, y)); // maxR, bright, mix, thick
        if (wb.y <= 0.001) continue;                  // dead slot — cheap skip

        float age = (uTime - wa.z) * uSpeed;
        if (age < 0.0) continue;
        float r = wa.w * age;                         // current radius
        if (r > wb.x) continue;                       // grown past max radius

        float d = distance(pr, wa.xy);
        // Thin crisp gaussian ridge at radius r; fades as the ring grows
        // (full at birth → gone by maxRadius).
        float ridge = exp(-pow((d - r) / max(wb.w * 1.3, 0.02), 2.0));
        float fade = 1.0 - smoothstep(wb.x * 0.5, wb.x, r);
        ringCol += mix(uCyan, uMint, clamp(wb.z, 0.0, 1.0)) * (ridge * fade * wb.y);
      }

      // Gentle center attenuation — keeps the content corridor readable
      // without ever zeroing it: rings from the surrounding foci still cross
      // the axis at low density (negative space, not a hole).
      float ca = mix(0.74, 1.0, smoothstep(0.35, 1.5, length(p)));

      // ---- EEG trace garnish (glass-fixed, dim) ---------------------------
      vec2 q = vUv * 2.0 - 1.0;
      float amp = uStdp * 0.5 + 0.16;

      float t1 = -0.55 + amp * (
        0.55 * sin(q.x * 0.85 - uTime * 1.1 * uSpeed) +
        0.30 * sin(q.x * 2.30 + uTime * 1.60 * uSpeed + 1.3) +
        0.15 * sin(q.x * 5.10 - uTime * 2.70 * uSpeed + 4.1));
      float trace1 = exp(-pow((q.y - t1) / 0.035, 2.0)) * 0.085;

      float t2 = 0.55 + amp * (
        0.50 * sin(q.x * 0.70 + uTime * 1.30 * uSpeed + 0.6) +
        0.32 * sin(q.x * 2.10 - uTime * 1.90 * uSpeed + 2.9) +
        0.18 * sin(q.x * 4.40 + uTime * 3.10 * uSpeed + 5.2));
      float trace2 = exp(-pow((q.y - t2) / 0.04, 2.0)) * 0.065;

      // Faint baseline (graticule) under each trace.
      float base1 = exp(-pow((q.y + 0.55) / 0.012, 2.0)) * 0.03;
      float base2 = exp(-pow((q.y - 0.55) / 0.012, 2.0)) * 0.03;

      // ---- Focal embers + spike flash -------------------------------------
      vec3 emberCol = vec3(0.0);
      for (int i = 0; i < ${centerCount}; i++) {
        vec2 pc = rotV(uCenters[i] * vec2(uHalfW, uHalfH), tc, ts);
        vec2 d2 = pr - pc;
        emberCol += mix(uCyan, uMint, uCenterTints[i]) * exp(-dot(d2, d2) * 4.0) * 0.10;
      }
      vec2 ac = rotV(uActiveCenter, tc, ts);
      vec2 da = pr - ac;
      emberCol += mix(uCyan, uMint, uAccentMix) * exp(-dot(da, da) * 4.0) * uActiveBright;
      // AP flash: a wide glow that expands + decays as uSpikeGlow falls.
      emberCol += mix(uCyan, uMint, uAccentMix)
        * exp(-dot(da, da) * (1.6 + uSpikeGlow * 1.4)) * uSpikeGlow * 0.5;

      // ---- Compose ---------------------------------------------------------
      vec3 col = ringCol * ca
        + mix(uCyan, uMint, 0.25) * (trace1 + base1)
        + mix(uCyan, uMint, 0.65) * (trace2 + base2)
        + emberCol;

      // Edge fade — the practical "depth fog" for a flat plane: waves melt
      // into the background toward the frame edges and corners.
      float radial = length(vUv * 2.0 - 1.0);
      float edge = 1.0 - smoothstep(0.9, 1.45, radial);

      gl_FragColor = vec4(col * (uGlobalAlpha * edge), 1.0);
    }
  `;
}

export const firingWaveFragmentShader = buildFiringWaveFragmentShader();
