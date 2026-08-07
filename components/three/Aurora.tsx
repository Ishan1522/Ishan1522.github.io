'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import {
  auroraVertexShader,
  buildAuroraFragmentShader,
} from '@/lib/aurora-shaders';
import { useSectionStore, previewUi, SPEED_MAX } from '@/lib/section-store';
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

// ---- Scroll-clamp caps (Feature 2) -----------------------------------------
// Fast scrolling flips the section store targets in quick succession; these
// hard caps bound every scroll-derived input so no flick can push the noise
// domain into a whip. Ranges were verified against the shader's usage of
// each uniform in lib/aurora-shaders.ts:
//   uFlow    = uTime * uFlow * uSpeed drift clock        (authored 0.5..1.06)
//   uShimmer = stdpIntensity brightness lift             (authored 0..0.8)
//   uSpin    = rotation drift, authored ±0.015 rad       (clamped ±0.02)
//   uPulse   = spikeActive breathing swell               (authored 0/1)
//   uSpeed   = harness multiplier, authored 0.1..4
const FLOW_MIN = 0.5; // calm resting drift
const FLOW_MAX = 1.1; // ~2.2x base — preserves the authored 1.06 max
const SHIMMER_MAX = 0.85; // slightly above authored 0.8
const SPIN_ABS = 0.02; // above authored ±0.015
const PULSE_MAX = 1.0;
// SPEED_MAX (harness speed multiplier cap) lives in lib/section-store.ts —
// Scene's UiRig clamps the effective previewUi.speed, and we re-clamp here
// as a final guard on the uniform write.

// ---- Lamp constants (Feature 1) --------------------------------------------
// A soft "lamp" that follows the pointer and gently lights the aurora, like
// a warm light held over fog. Skip on touch/coarse-pointer devices. Under
// reduced motion the lamp still follows (it is user-initiated, not auto
// motion) but at half strength to stay very gentle.
const LAMP_DAMP = 9; // λ — glides, no jitter (task: λ8-10)
const LAMP_SIGMA = 0.42; // σ in NDC units — big soft pool (~0.35-0.5 half-extent)
const LAMP_LIFT = 0.14; // max relative brightness lift at the cursor (~10-18%)
const LAMP_WARM = 0.25; // subtle warm cast so it reads as *light*, not brightening
const LAMP_REDUCED = 0.5; // strength multiplier under prefers-reduced-motion
const LAMP_OFF = new THREE.Vector2(99, 99); // far off-screen NDC → glow ≈ 0

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
 *
 * Pointer lamp: a soft radial glow that follows the cursor and gently
 * lights the aurora (warm, not a spotlight). The pointer listener is
 * skipped on touch / coarse-pointer devices, and the glow is hard-clamped
 * so it never overwhelms the field.
 *
 * Scroll spaz hardening: every scroll-derived target is hard-clamped
 * (FLOW_MAX / SHIMMER_MAX / SPIN_ABS / PULSE_MAX / SPEED_MAX) and damped
 * with deliberately low lambdas, so even a violent scroll flick produces a
 * controlled glide instead of a whip — values approach slowly and never
 * overshoot (see CameraRig in Scene.tsx for the dolly speed limit).
 */
export function Aurora({ mobile = false }: Props) {
  const reduced = useReducedMotion();

  // Mobile gets 3 noise octaves instead of 4 — the fragment shader is the
  // only cost, and phones don't need the finest fold detail.
  const fragmentShader = useMemo(
    () => buildAuroraFragmentShader(mobile ? 3 : 4, LAMP_LIFT, LAMP_WARM, LAMP_SIGMA),
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
      // Lamp: cursor NDC (screen-fixed), defaults far off-screen so the
      // glow contribution is ~0 until the pointer actually moves (field
      // stays calm before first interaction).
      uMouse: { value: new THREE.Vector2(LAMP_OFF.x, LAMP_OFF.y) },
      // Lamp strength — 1 normal, 0.5 under prefers-reduced-motion (the
      // lamp still follows the cursor, it is user-initiated, but gently).
      uLampStrength: { value: 1 },
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

  // Lamp: raw client coords from the listener (no React state), damped
  // into the uMouse uniform (NDC) inside useFrame so it glides, not snaps.
  const mouseClientRef = useRef({ x: 0, y: 0 });
  const hasMouseRef = useRef(false);

  // Pointer lamp listener — desktop only. Skipped on small screens (the
  // `mobile` prop, set by useIsMobile) and on coarse-pointer devices
  // (touch/pen-first), where there is no hover mouse.
  useEffect(() => {
    if (mobile) return;
    if (window.matchMedia?.('(pointer: coarse)')?.matches) return;
    const onPointerMove = (e: PointerEvent) => {
      mouseClientRef.current.x = e.clientX;
      mouseClientRef.current.y = e.clientY;
      hasMouseRef.current = true;
    };
    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [mobile]);

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

    // Damped reactive values. Every scroll-derived target is hard-clamped
    // before damping so no input (fast section flips, harness multipliers)
    // can push the shader uniforms past their designed range. Lambdas are
    // deliberately low so a violent flick becomes a controlled glide —
    // damp() = exponential smoothing, so a lower λ approaches slower and
    // never overshoots.
    flowRef.current = damp(
      flowRef.current,
      clamp(0.5 + 0.8 * firingRate, FLOW_MIN, FLOW_MAX),
      1.1,
      dt,
    );
    shimmerRef.current = damp(
      shimmerRef.current,
      clamp(stdpIntensity, 0, SHIMMER_MAX),
      1.2,
      dt,
    );
    accentRef.current = damp(
      accentRef.current,
      section / Math.max(1, sections.length - 1),
      2,
      dt,
    );
    spinRef.current = damp(
      spinRef.current,
      clamp(clamp(rotation, -0.3, 0.3) * 0.05, -SPIN_ABS, SPIN_ABS),
      1.3,
      dt,
    );
    pulseRef.current = damp(
      pulseRef.current,
      clamp(spikeActive, 0, PULSE_MAX),
      0.9,
      dt,
    );
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

    // Lamp: client → NDC (same screen-fixed space as p0 in the shader),
    // damped so it glides, no jitter.
    if (hasMouseRef.current) {
      const ndcX = (mouseClientRef.current.x / Math.max(1, state.size.width)) * 2 - 1;
      const ndcY = -((mouseClientRef.current.y / Math.max(1, state.size.height)) * 2 - 1);
      const k = 1 - Math.exp(-LAMP_DAMP * dt);
      uniforms.uMouse.value.x += (ndcX - uniforms.uMouse.value.x) * k;
      uniforms.uMouse.value.y += (ndcY - uniforms.uMouse.value.y) * k;
    }

    // Write uniforms.
    const u = uniforms;
    u.uTime.value = reduced ? 0 : timeRef.current;
    u.uSpeed.value = clamp(speed, 0.1, SPEED_MAX);
    u.uFlow.value = clamp(flowRef.current, FLOW_MIN, FLOW_MAX);
    u.uShimmer.value = clamp(shimmerRef.current, 0, SHIMMER_MAX);
    u.uSpin.value = clamp(spinRef.current, -SPIN_ABS, SPIN_ABS);
    u.uPulse.value = clamp(pulseRef.current, 0, PULSE_MAX);
    u.uAccentMix.value = clamp(accentRef.current, 0, 1);
    u.uGlobalAlpha.value = alphaRef.current;
    u.uHalfW.value = halfW;
    u.uHalfH.value = halfH;
    u.uLampStrength.value = reduced ? LAMP_REDUCED : 1;
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
