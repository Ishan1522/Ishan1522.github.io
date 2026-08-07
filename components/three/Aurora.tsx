'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import {
  auroraVertexShader,
  buildAuroraFragmentShader,
} from '@/lib/aurora-shaders';
import { useSectionStore, previewUi } from '@/lib/section-store';
import { COLORS, clamp, damp, hexToRGB } from '@/lib/constants';
import { sections } from '@/data/sections';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Props {
  mobile?: boolean;
}

/**
 * B4-local atmospheric depth color — a restrained deep indigo-teal derived
 * from the palette's ink-900 / cyan-deep range. Kept here (not in the shared
 * COLORS map, which must stay in sync with globals.css) because it is
 * background-only atmosphere, not a UI palette color.
 */
const AURORA_INDIGO = '#17324e';

const CAMERA_FOV = 45; // Scene Canvas camera fov
const PLANE_Z = -0.4; // world Z of the background plane
const PLANE_SIZE = 24; // always larger than the frustum at any camera Z

/**
 * The B4 background subject: aurora gradient layers.
 *
 * One large camera-facing plane whose fragment shader paints layered
 * domain-warped noise "curtains" (see lib/aurora-shaders.ts). Pure
 * procedural — no CPU sim, no textures, no per-band geometry — so the whole
 * background is a single additive quad whose fragment shader does all the
 * work. Deliberately dim and calm: it is atmosphere behind content, not a
 * subject.
 *
 * Section reactivity reuses the scroll store's phase values, damped into
 * uniforms inside useFrame (store read via getState, no re-renders):
 *
 *   section        → uAccentMix, gentle cyan → mint drift (breathes)
 *   firingRate     → uFlow, drift speed of the noise
 *   dendriteGrowth → uGlobalAlpha reveal envelope (fade-in on load)
 *   rotation       → uSpin, very slow rotational drift of the field
 *   spikeActive    → uPulse, faint slow brightness swell (NOT a burst)
 *   stdpIntensity  → uShimmer, whisper of brightness lift
 *   previewUi      → intensity scales uGlobalAlpha; speed scales the clock
 *
 * Full-bleed composition: the plane is PLANE_SIZE units across (always
 * larger than the frustum) and the shader maps the visible portion to NDC
 * via live half-extents, so the field fills the viewport at any camera Z —
 * no empty-center problem, and the whole thing sits dimmer than the content
 * corridor (peak ~0.3 luma, well below the Bloom threshold).
 *
 * Reduced motion: the drift clock freezes (uTime = 0) and the reactive
 * dampers settle — the shader still renders one coherent, calm static
 * aurora. Mobile: fewer noise octaves (3 vs 4) and a slightly dimmer
 * envelope; Bloom/Vignette are off anyway.
 */
export function Aurora({ mobile = false }: Props) {
  const reduced = useReducedMotion();

  // Mobile gets 3 noise octaves instead of 4 — the fragment shader is the
  // only cost, and phones don't need the finest fold detail.
  const fragmentShader = useMemo(
    () => buildAuroraFragmentShader(mobile ? 3 : 4),
    [mobile],
  );

  // Stable uniform targets — mutated in useFrame, never via React state.
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: 1 },
      uFlow: { value: 0.5 },
      uShimmer: { value: 0 },
      uSpin: { value: 0 },
      uPulse: { value: 0 },
      uAccentMix: { value: 0 },
      uGlobalAlpha: { value: 0.55 },
      uHalfW: { value: 4 },
      uHalfH: { value: 2.28 },
      uCyan: { value: new THREE.Color(...hexToRGB(COLORS.cyan)) },
      uMint: { value: new THREE.Color(...hexToRGB(COLORS.mint)) },
      uIndigo: { value: new THREE.Color(...hexToRGB(AURORA_INDIGO)) },
    }),
    [],
  );

  // Damped reactive refs.
  const timeRef = useRef(0);
  const alphaRef = useRef(0.55);
  const accentRef = useRef(0);
  const flowRef = useRef(0.5);
  const shimmerRef = useRef(0);
  const spinRef = useRef(0);
  const pulseRef = useRef(0);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05); // clamp long frames (tab switch)
    const store = useSectionStore.getState();
    const { firingRate, stdpIntensity, spikeActive, dendriteGrowth, rotation } =
      store.target;
    // Guard: clamp so a section added to data/sections.ts can't overflow.
    const section = Math.min(store.section, sections.length - 1);
    const { intensity, speed } = previewUi;

    // Drift clock — frozen under reduced motion (calm static frame).
    if (!reduced) timeRef.current += dt;

    // Damped reactive values.
    flowRef.current = damp(flowRef.current, 0.5 + 0.8 * firingRate, 1.5, dt);
    shimmerRef.current = damp(shimmerRef.current, stdpIntensity, 1.6, dt);
    accentRef.current = damp(
      accentRef.current,
      section / Math.max(1, sections.length - 1),
      2,
      dt,
    );
    spinRef.current = damp(
      spinRef.current,
      clamp(rotation, -0.3, 0.3) * 0.05,
      1.6,
      dt,
    );
    pulseRef.current = damp(pulseRef.current, spikeActive, 1.1, dt);
    alphaRef.current = damp(
      alphaRef.current,
      (0.35 + 0.65 * dendriteGrowth) * intensity * (mobile ? 0.8 : 1),
      2,
      dt,
    );

    // Live frustum half-extents at the plane (Scene camera: fov 45, dollies
    // on cameraZ). Dividing the shader's world position by these maps the
    // visible rect to NDC — full-bleed at any camera Z.
    const camZ = state.camera.position.z;
    const halfH = Math.tan((CAMERA_FOV * Math.PI) / 360) * (camZ - PLANE_Z);
    const halfW = halfH * (state.size.width / Math.max(1, state.size.height));

    // Write uniforms.
    const u = uniforms;
    u.uTime.value = reduced ? 0 : timeRef.current;
    u.uSpeed.value = speed;
    u.uFlow.value = flowRef.current;
    u.uShimmer.value = shimmerRef.current;
    u.uSpin.value = spinRef.current;
    u.uPulse.value = pulseRef.current;
    u.uAccentMix.value = accentRef.current;
    u.uGlobalAlpha.value = alphaRef.current;
    u.uHalfW.value = halfW;
    u.uHalfH.value = halfH;
  });

  return (
    <mesh position={[0, 0, PLANE_Z]} frustumCulled={false}>
      <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
      <shaderMaterial
        vertexShader={auroraVertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}
