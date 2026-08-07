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
 *   - Section-change burst: when the active section flips, a decaying
 *     impulse is folded into uCharge/uSize/uRevealAlpha so the whole field
 *     visibly surges and then settles (decay ≈ 2.5/s, ~0.4s).
 *   - Scroll-linked turbulence: the damped rate of change of the document
 *     scroll progress adds to uTurbulence — active scrolling churns the
 *     field, resting returns to calm.
 *   - Pointer repel (desktop only): a damped world-space mouse position is
 *     sent to uMouse; the vertex shader pushes particles away within
 *     uMouseRadius using uMouseForce (negative = repel). Skipped on touch
 *     devices (no hover mouse there).
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
  // useFrame; burstRef starts at 1 and decays exponentially (~2.5/s).
  const lastSectionRef = useRef(useSectionStore.getState().section);
  const burstRef = useRef(0);

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
      uCenterFadeStart: { value: 1.15 },
      uCenterFadeEnd: { value: 3.1 },
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

    // Section-change burst: a decaying impulse folded into charge/size/
    // revealAlpha so the whole field surges on each section change, then
    // settles. Gated by intensity so the harness stays in control.
    if (section !== lastSectionRef.current) {
      lastSectionRef.current = section;
      burstRef.current = 1;
    }
    burstRef.current *= Math.exp(-dt * 2.5);
    const burst = burstRef.current * intensityMult;

    // firingRate → advection strength (calm base, up to ~2.5x at the end).
    const flowSpeed = (0.5 + firingRate * 1.1) * speedMult;
    u.uSpeed.value = damp(u.uSpeed.value, flowSpeed, 1.8, dt);
    u.uStep.value = u.uSpeed.value * 0.2;

    // stdpIntensity → curl turbulence + how far particles roam. Scroll
    // activity (damped rate of scroll-progress change) adds churn while
    // scrolling; resting decays back to the section's calm level.
    const scrollDelta = Math.abs(scrollProgress.current - lastScrollRef.current);
    lastScrollRef.current = scrollProgress.current;
    scrollActivityRef.current = damp(
      scrollActivityRef.current,
      clamp(scrollDelta * 80, 0, 1),
      4,
      dt,
    );
    const turb = 0.55 + stdpIntensity * 1.2 + scrollActivityRef.current * 0.9 * speedMult;
    u.uTurbulence.value = damp(u.uTurbulence.value, turb, 2.0, dt);
    u.uWander.value = 0.85 + u.uTurbulence.value * 0.45;

    // dendriteGrowth → global reveal envelope (alpha gated by intensity so
    // the harness's brightness multiplier is actually respected). The burst
    // briefly swells the alpha gate for a full-field surge.
    u.uReveal.value = damp(u.uReveal.value, dendriteGrowth, 2.0, dt);
    u.uRevealAlpha.value =
      (0.45 + 0.55 * u.uReveal.value) * intensityMult * (1 + burst * 0.35);

    // spikeActive → charge boost (brightness/size → crosses bloom subtly).
    // The burst adds a transient charge spike on top.
    u.uCharge.value = damp(
      u.uCharge.value,
      spikeActive * intensityMult + burst * 0.9,
      2.5,
      dt,
    );

    // uSize is the base point size — scaled by intensity, plus a short
    // burst swell so the surge is visible even at production dimness.
    u.uSize.value = (mobile ? 0.042 : 0.05) * intensityMult * (1 + burst * 0.6);

    // Per-section cyan → mint accent drift.
    const accent = (section / Math.max(1, sections.length - 1)) * 0.5;
    u.uAccentMix.value = damp(u.uAccentMix.value, accent, 2.0, dt);

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

    // Field rig — slow Y spin + damped scroll-driven tilt.
    if (group) {
      group.rotation.y += dt * (mobile ? 0.018 : 0.03);
      tiltRef.current = damp(tiltRef.current, clamp(rotation, -0.3, 0.3), 1.8, dt);
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
