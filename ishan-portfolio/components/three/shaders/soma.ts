/**
 * Soma (cell body) shader.
 *
 * Effect: Fresnel rim glow, slow breathing pulse, subtle inner flicker.
 * Uses Fresnel — the effect where surfaces glow more at grazing angles
 * (think: how a soap bubble glows at its edge). This reads as "volumetric"
 * without any actual volume rendering.
 */

export const somaVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const somaFragment = /* glsl */ `
  uniform float uTime;
  uniform float uFiringRate;   // 0..1+ — controls pulse frequency
  uniform vec3  uColorCore;    // inner color
  uniform vec3  uColorRim;     // rim color (usually brighter / cyan)

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    // Fresnel: bright at edges (where normal is perpendicular to view).
    float fresnel = 1.0 - abs(dot(viewDir, vNormal));
    fresnel = pow(fresnel, 2.5);

    // Slow, shallow breathing pulse. Intentionally subtle — no sharp spikes.
    float pulseSpeed = 0.8 + uFiringRate * 1.2;
    float pulse = 0.5 + 0.5 * sin(uTime * pulseSpeed);

    vec3 color = mix(uColorCore, uColorRim, fresnel);
    // Total intensity kept below 1 so bloom (threshold 0.75) ignores the soma
    // body and only picks up the very brightest rim.
    float intensity = 0.22 + 0.12 * pulse + 0.55 * fresnel;

    float alpha = clamp(intensity * 0.85, 0.0, 0.9);
    gl_FragColor = vec4(color * intensity, alpha);
  }
`;
