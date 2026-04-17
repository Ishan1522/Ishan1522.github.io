/**
 * Dendrite shader.
 *
 * A TubeGeometry is rendered with this material. The tube's UV.x runs 0..1
 * from soma outward to the tip. `uGrowth` (0..1) acts as a "reveal" threshold:
 *   - UV.x <= uGrowth  → solid line, base color
 *   - UV.x at uGrowth  → bright glowing tip (growth cone)
 *   - UV.x >  uGrowth  → hidden (alpha 0)
 *
 * As `uGrowth` animates 0→1, the dendrite appears to grow outward with a
 * bright leading edge, mimicking real axonal outgrowth.
 */

export const dendriteVertex = /* glsl */ `
  varying vec2 vUv;
  varying float vAlongTube;

  void main() {
    vUv = uv;
    // TubeGeometry: uv.x runs along the tube length, uv.y around circumference.
    vAlongTube = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const dendriteFragment = /* glsl */ `
  uniform float uGrowth;       // 0..1
  uniform float uTime;
  uniform float uStdpIntensity; // 0..1 — flickers strengthen near full STDP
  uniform vec3  uColor;
  uniform vec3  uTipColor;

  varying float vAlongTube;

  void main() {
    // Reveal mask: hard cutoff just past the growth front.
    float revealed = step(vAlongTube, uGrowth);
    if (revealed < 0.5) discard;

    // Glowing tip — narrow bright band at the growth front.
    float dist = uGrowth - vAlongTube;
    float tipGlow = exp(-dist * 35.0);

    // Faint shimmer along the grown portion, modulated by STDP.
    float shimmer = 0.5 + 0.5 * sin(vAlongTube * 40.0 - uTime * 2.0);
    shimmer = mix(1.0, shimmer, 0.15 + uStdpIntensity * 0.35);

    vec3 col = mix(uColor, uTipColor, tipGlow);
    float alpha = (0.55 + tipGlow * 0.8) * shimmer;
    gl_FragColor = vec4(col * (0.9 + tipGlow * 1.5), alpha);
  }
`;
