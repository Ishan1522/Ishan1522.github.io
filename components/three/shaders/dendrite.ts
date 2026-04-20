/**
 * Dendrite shader.
 *
 * uGrowth (0..1): reveals the tube from soma outward with a glowing tip.
 * uWave  (-0.1..1.2): AP propagation front. A bright band travels from
 *   0 (soma) to 1 (tip). Idle when < 0.
 */

export const dendriteVertex = /* glsl */ `
  varying vec2 vUv;
  varying float vAlongTube;

  void main() {
    vUv = uv;
    vAlongTube = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const dendriteFragment = /* glsl */ `
  uniform float uGrowth;
  uniform float uTime;
  uniform float uStdpIntensity;
  uniform float uWave;          // -0.1 = idle, 0..1 = AP front position
  uniform vec3  uColor;
  uniform vec3  uTipColor;

  varying float vAlongTube;

  void main() {
    float revealed = step(vAlongTube, uGrowth);
    if (revealed < 0.5) discard;

    // Growth cone glow at the reveal front.
    float dist = uGrowth - vAlongTube;
    float tipGlow = exp(-dist * 35.0);

    // Shimmer along grown portion.
    float shimmer = 0.5 + 0.5 * sin(vAlongTube * 40.0 - uTime * 2.0);
    shimmer = mix(1.0, shimmer, 0.15 + uStdpIntensity * 0.35);

    vec3 col = mix(uColor, uTipColor, tipGlow);
    float alpha = (0.55 + tipGlow * 0.8) * shimmer;

    // AP wave — a narrow bright band travelling soma → tip.
    // Only active when uWave is in [0, 1.1]. exp() falls off sharply
    // so only the very front glows; tubes behind it settle back to base color.
    float waveActive = step(0.0, uWave) * step(uWave, 1.1);
    float waveDist = abs(vAlongTube - uWave);
    float waveGlow = exp(-waveDist * 30.0) * waveActive;

    col  = col + uTipColor * waveGlow * 2.8;
    alpha = clamp(alpha + waveGlow * 1.0, 0.0, 1.0);

    gl_FragColor = vec4(col * (0.9 + tipGlow * 1.5 + waveGlow * 1.2), alpha);
  }
`;