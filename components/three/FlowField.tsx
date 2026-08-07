'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { buildParticleData } from '@/lib/flow-field';
import {
  flowFieldFragmentShader,
  flowFieldVertexShader,
} from '@/lib/flow-field-shaders';
import { useSectionStore, previewUi, scrollProgress } from '@/lib/section-store';
import { COLORS, clamp, damp, hexToRGB } from '@/lib/constants';
import { sections } from '@/data/sections';

interface Props {
  mobile?: boolean;
}

/**
 * Section-change burst envelope. On a section flip the envelope ramps from
 * 0 → 1 over BURST_ATTACK seconds, then falls off exponentially with time
 * constant BURST_DECAY_TAU (~5% remaining at ~1.5s). The peak folds are
 * deliberately modest (0.55 into charge, 0.35 into size, 0.2 into reveal
 * alpha) so a section change reads as a swell, not a flash.
 */
const BURST_ATTACK = 0.15; // seconds to swell to peak
const BURST_DECAY_TAU = 0.45; // exp tail — ~6% remaining at ~1.3s

/**
 * Field-rig Y rotation: a bounded sway instead of an unbounded constant
 * spin. An accumulating spin leaves the cloud permanently rotated in depth;
 * with perspective + fog the near side of a rotated cloud reads brighter
 * and larger, which shows as a persistent horizontal skew (the "leans left
 * while scrolling" report). Two incommensurate sines keep it organic and
 * non-repeating while staying bounded (±~0.29 rad), so the silhouette is
 * never parked on one side. Slow: max angular velocity ≈ 0.03 rad/s.
 */
const SPIN_SWAY_A = 0.22; // primary sway amplitude (rad)
const SPIN_SWAY_A_FREQ = 0.13; // rad/s — ~48s full sway
const SPIN_SWAY_B = 0.07; // secondary incommensurate wobble
const SPIN_SWAY_B_FREQ = 0.057; // rad/s — ~110s

/**
 * The B2 background subject: a curl-noise flow field of particles.
 *
 * Particles are seeded once on an edge-biased shell (lib/flow-field.ts)
 * and advected entirely on the GPU — the vertex shader recomputes each
 * position every frame as a pure function of (home, time), so there is
 * zero per-frame CPU work regardless of particle count (1600 desktop /
 * 450 mobile).
 *
 * Section reactivity reuses the scroll store's phase values, damped into
 * shader uniforms inside useFrame (store read via getState, no re-renders):
 *
 *   firingRate    → uSpeed/uStep      (advection strength)
 *   stdpIntensity → uTurbulence/uWander (curl chaos + wander radius)
 *   dendriteGrowth→ uReveal/uRevealAlpha (global fade-in on load/scroll)
 *   spikeActive   → uCharge           (brightness + size boost)
 *   section index → uAccentMix        (per-section cyan → mint drift)
 *   rotation      → group tilt        (damped X rotation of the whole field)
 *
 * "Un-boring" pass (2026-08):
 *   - Velocity streaks + speed-color: the fragment shader renders each
 *     sprite as an oriented streak along its flow direction (uStreak blends
 *     round point → ribbon) and tints slow = cyan → fast = mint via
 *     uSlowColor/uFastColor. Streaks get a slightly larger sprite so the
 *     gaussian ribbon has room to read.
 *   - Section-change burst: when the active section flips, a time-based
 *     envelope (0.15s attack ramp → exponential tail, ~1.3-1.5s to die)
 *     swells into uCharge/uSize/uRevealAlpha. It reads as a slow swell,
 *     not a flash (the old instant spike + fast decay snapped too hard).
 *   - Scroll-linked turbulence: the damped rate of change of the document
 *     scroll progress adds to uTurbulence with a long time constant and a
 *     capped boost — active scrolling is gentle churn, not a jolt.
 *   - Pointer repel (desktop only): a damped world-space mouse position is
 *     sent to uMouse; the vertex shader pushes particles away within
 *     uMouseRadius using uMouseForce (negative = repel). Skipped on touch
 *     devices (no hover mouse there). Kept snappy — it's direct
 *     manipulation.
 *
 * Legibility: homes are periphery-biased, particles near the view axis are
 * dimmed (center-clearance fade) and depth-fogged (same FogExp2 as the
 * Scene), and overall brightness stays well below the content layer.
 */
export function FlowField({ mobile = false }: Props) {
  const count = mobile ? 450 : 1600;

  const data = useMemo(() => buildParticleData(count), [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    // THREE.Points + custom ShaderMaterial needs BOTH:
    //  - `position`: three.js r168 renderBufferDirect derives the draw count
    //    from `geometry.attributes.position` for non-indexed geometry; with
    //    no position (or index), drawCount = Infinity → silent early return,
    //    nothing drawn, no console error (verified in three.module.js).
    //  - `aHome`: the vertex shader reads THIS for each particle's home;
    //    without a bound buffer it defaults to (0,0,0) and the center-fade
    //    kills everything.
    // Both point at the same data — the shader uses aHome, the renderer uses
    // position only for the vertex count. Caught by vault bg-capture pipeline.
    const homes = new THREE.BufferAttribute(data.positions, 3);
    geo.setAttribute('position', homes);
    geo.setAttribute('aHome', homes);
    geo.setAttribute('aSeed', new THREE.BufferAttribute(data.seeds, 4));
    geo.setAttribute('aColor', new THREE.BufferAttribute(data.colors, 3));
    return geo;
  }, [data]);

  const groupRef = useRef<THREE.Group>(null);
  const tiltRef = useRef(0);

  // Section-change burst: lastSectionRef detects a section flip inside
  // useFrame; burstTimeRef runs the attack→decay envelope from 0. Starts
  // large (10s in) so there is no burst on mount.
  const lastSectionRef = useRef(useSectionStore.getState().section);
  const burstTimeRef = useRef(10);

  // Scroll-linked turbulence: tracks the rate of change of scroll progress.
  const lastScrollRef = useRef(scrollProgress.current);
  const scrollActivityRef = useRef(0);

  // Pointer repel: raw client coords from the listener, mapped to the field
  // plane and damped into uMouse inside useFrame (no React state).
  const mouseClientRef = useRef({ x: 0, y: 0 });
  const hasMouseRef = useRef(false);
  const mouseWorldRef = useRef(new THREE.Vector3());

  // Uniforms are a stable ref target — mutated in useFrame, never via
  // React state, so no re-renders at 60Hz.
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: 0.6 },
      uTurbulence: { value: 0.7 },
      uFreq: { value: 0.14 },
      uStep: { value: 0.12 },
      uWander: { value: 1.1 },
      uHalf: { value: new THREE.Vector3(3.6, 2.1, 1.9) },
      uScale: { value: 540 },
      uSize: { value: mobile ? 0.042 : 0.05 },
      uReveal: { value: 0.45 },
      uRevealAlpha: { value: 0.7 },
      uCharge: { value: 0 },
      uFogDensity: { value: 0.045 },
      // Center-clearance fade zone: softened (start 1.15 → 1.0, end 3.1 →
      // 2.8) so the inner strays + density ramp read as hazy texture rather
      // than a hard hollow ring, while the content corridor stays clear.
      uCenterFadeStart: { value: 1.0 },
      uCenterFadeEnd: { value: 2.8 },
      uAccentColor: { value: new THREE.Color(...hexToRGB(COLORS.mintGlow)) },
      uAccentMix: { value: 0 },
      uStreak: { value: 0.7 },
      uSlowColor: { value: new THREE.Color(...hexToRGB(COLORS.cyan)) },
      uFastColor: { value: new THREE.Color(...hexToRGB(COLORS.mintGlow)) },
      // Default uMouse far outside the field → repelFalloff = 0 until the
      // pointer actually moves (field is stable before first interaction).
      uMouse: { value: new THREE.Vector3(9999, 9999, 0) },
      uMouseRadius: { value: 2.0 },
      uMouseForce: { value: -0.65 },
    }),
    [mobile],
  );

  // Pointer repel listener — desktop only. Skipped on small screens (the
  // `mobile` prop, set by useIsMobile) and on coarse-pointer devices
  // (touch/pen-first), where there is no hover mouse.
  useEffect(() => {
    if (mobile) return;
    // Coarse-pointer devices (touch/pen-primary) have no hover mouse.
    if (window.matchMedia?.('(pointer: coarse)')?.matches) return;
    const onPointerMove = (e: PointerEvent) => {
      mouseClientRef.current.x = e.clientX;
      mouseClientRef.current.y = e.clientY;
      hasMouseRef.current = true;
    };
    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [mobile]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const store = useSectionStore.getState();
    const { rotation, firingRate, stdpIntensity, spikeActive, dendriteGrowth } =
      store.target;
    const section = store.section;

    const u = uniforms;
    u.uTime.value = t;

    // Preview-harness multipliers — damped effective values from Scene's
    // UiRig. Both are 1 on the main page, so this is a no-op there.
    const { intensity: intensityMult, speed: speedMult } = previewUi;

    // Section-change burst: a time-based envelope — 0.15s attack ramp to
    // peak, then a long exponential tail (~6% at 1.3s). Folds are modest
    // (charge +0.55, size +35%, reveal +20%) so it swells, it doesn't
    // flash. Gated by intensity so the harness stays in control.
    if (section !== lastSectionRef.current) {
      lastSectionRef.current = section;
      burstTimeRef.current = 0;
    }
    burstTimeRef.current += dt;
    const bt = burstTimeRef.current;
    const burst =
      (bt < BURST_ATTACK ? bt / BURST_ATTACK : Math.exp(-(bt - BURST_ATTACK) / BURST_DECAY_TAU)) *
      intensityMult;

    // firingRate → advection strength (calm base, up to ~2.5x at the end).
    const flowSpeed = (0.5 + firingRate * 1.1) * speedMult;
    u.uSpeed.value = damp(u.uSpeed.value, flowSpeed, 1.4, dt);
    u.uStep.value = u.uSpeed.value * 0.2;

    // stdpIntensity → curl turbulence + how far particles roam. Scroll
    // activity (damped rate of scroll-progress change) adds gentle churn
    // while scrolling: slow time constant (λ1.8) + capped boost (0.5) so
    // active scrolling glides rather than jolts. Resting decays back to
    // the section's calm level.
    const scrollDelta = Math.abs(scrollProgress.current - lastScrollRef.current);
    lastScrollRef.current = scrollProgress.current;
    scrollActivityRef.current = damp(
      scrollActivityRef.current,
      clamp(scrollDelta * 80, 0, 1),
      1.8,
      dt,
    );
    const turb = 0.55 + stdpIntensity * 1.2 + scrollActivityRef.current * 0.5 * speedMult;
    u.uTurbulence.value = damp(u.uTurbulence.value, turb, 1.2, dt);
    u.uWander.value = 0.85 + u.uTurbulence.value * 0.45;

    // dendriteGrowth → global reveal envelope (alpha gated by intensity so
    // the harness's brightness multiplier is actually respected). The burst
    // briefly swells the alpha gate for a full-field surge.
    u.uReveal.value = damp(u.uReveal.value, dendriteGrowth, 1.4, dt);
    u.uRevealAlpha.value =
      (0.45 + 0.55 * u.uReveal.value) * intensityMult * (1 + burst * 0.2);

    // spikeActive → charge boost (brightness/size → crosses bloom subtly).
    // The burst adds a transient charge swell on top (lower peak fold).
    u.uCharge.value = damp(
      u.uCharge.value,
      spikeActive * intensityMult + burst * 0.55,
      1.6,
      dt,
    );

    // uSize is the base point size — damped (not snapped) so the burst
    // swell glides, scaled by intensity, plus a modest surge fold.
    const sizeTarget = (mobile ? 0.042 : 0.05) * intensityMult * (1 + burst * 0.35);
    u.uSize.value = damp(u.uSize.value, sizeTarget, 1.6, dt);

    // Per-section cyan → mint accent drift — λ1 so the color glides
    // (the old λ2 read as an abrupt hue snap on section flips).
    const accent = (section / Math.max(1, sections.length - 1)) * 0.5;
    u.uAccentMix.value = damp(u.uAccentMix.value, accent, 1.0, dt);

    // Map the home shell onto the live frustum half-extents so the field
    // roughly fills the view regardless of aspect / camera dolly.
    const camZ = state.camera.position.z;
    const halfH = Math.tan((45 * Math.PI) / 360) * camZ; // fov 45
    const halfW = halfH * (state.size.width / Math.max(1, state.size.height));
    u.uHalf.value.set(halfW * 0.96, halfH * 0.96, 2.0);
    u.uScale.value = state.size.height * state.viewport.dpr * 0.5;

    // Pointer repel: NDC → world on the field plane, then into the group's
    // local frame (the rig spins/tilts, so worldToLocal keeps the repel
    // point glued to the cursor). Damped so it glides, not snaps.
    const group = groupRef.current;
    if (group && hasMouseRef.current) {
      const ndcX = (mouseClientRef.current.x / Math.max(1, state.size.width)) * 2 - 1;
      const ndcY = -((mouseClientRef.current.y / Math.max(1, state.size.height)) * 2 - 1);
      mouseWorldRef.current.set(ndcX * halfW * 0.96, ndcY * halfH * 0.96, 0);
      group.updateMatrixWorld(true);
      group.worldToLocal(mouseWorldRef.current);
      u.uMouse.value.lerp(mouseWorldRef.current, 1 - Math.exp(-8 * dt));
    }

    // Field rig — bounded Y sway + damped scroll-driven tilt. The Y sway
    // is bounded (see SPIN_SWAY_* above) so the perspective/fog-weighted
    // silhouette never parks on one side; the tilt clamp is ±0.15 and the
    // damp is slow (λ1.2) so a section tilt glides instead of snapping the
    // whole cloud sideways. Both pivot around the group origin, which sits
    // at the field centroid (homes are angularly symmetric in seed space).
    if (group) {
      group.rotation.y =
        Math.sin(t * SPIN_SWAY_A_FREQ) * SPIN_SWAY_A + Math.sin(t * SPIN_SWAY_B_FREQ) * SPIN_SWAY_B;
      tiltRef.current = damp(tiltRef.current, clamp(rotation, -0.15, 0.15), 1.2, dt);
      group.rotation.x = tiltRef.current;
    }
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          vertexShader={flowFieldVertexShader}
          fragmentShader={flowFieldFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
