/**
 * Spike shader — a bright Fresnel-y point of light that rides the axon.
 * The spike's position along the axon curve is handled in JS; this shader
 * just makes the sphere look luminous and soft-edged rather than solid.
 */

export const spikeVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

export const spikeFragment = /* glsl */ `
  uniform float uIntensity;
  uniform vec3  uColor;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 v = normalize(vViewPosition);
    float fresnel = 1.0 - abs(dot(v, vNormal));
    fresnel = pow(fresnel, 1.5);
    float core = 1.0 - fresnel;
    vec3 col = uColor * (core * 1.8 + fresnel * 2.4);
    float alpha = clamp(uIntensity * (0.55 + fresnel * 0.8), 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`;
