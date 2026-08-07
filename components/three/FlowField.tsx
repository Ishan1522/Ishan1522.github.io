'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { buildParticleData } from '@/lib/flow-field';
import {
  flowFieldFragmentShader,
  flowFieldVertexShader,
} from '@/lib/flow-field-shaders';
import { useSectionStore, previewUi } from '@/lib/section-store';
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
 * Legibility: homes are periphery-biased, particles near the view axis are
 * dimmed (center-clearance fade) and depth-fogged (same FogExp2 as the
 * Scene), and overall brightness stays well below the content layer.
 */
export function FlowField({ mobile = false }: Props) {
  const count = mobile ? 450 : 1600;

  const data = useMemo(() => buildParticleData(count), [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    // The vertex shader recomputes each particle position from `aHome`
    // (lib/flow-field-shaders.ts) and never reads the built-in `position`
    // attribute. Binding the homes as `aHome` (not `position`) is what
    // actually feeds the shader — previously nothing was bound to aHome,
    // so every particle got the WebGL default (0,0,0), collapsed to the
    // origin and was faded out by the center-clearance term, leaving the
    // canvas blank (0 console errors). With a custom ShaderMaterial on
    // THREE.Points no `position` attribute is required for the draw.
    geo.setAttribute('aHome', new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(data.seeds, 4));
    geo.setAttribute('aColor', new THREE.BufferAttribute(data.colors, 3));
    return geo;
  }, [data]);

  const groupRef = useRef<THREE.Group>(null);
  const tiltRef = useRef(0);

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
    }),
    [mobile],
  );

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

    // firingRate → advection strength (calm base, up to ~2.5x at the end).
    const flowSpeed = (0.5 + firingRate * 1.1) * speedMult;
    u.uSpeed.value = damp(u.uSpeed.value, flowSpeed, 1.8, dt);
    u.uStep.value = u.uSpeed.value * 0.2;

    // stdpIntensity → curl turbulence + how far particles roam.
    const turb = 0.55 + stdpIntensity * 1.2;
    u.uTurbulence.value = damp(u.uTurbulence.value, turb, 2.0, dt);
    u.uWander.value = 0.85 + u.uTurbulence.value * 0.45;

    // dendriteGrowth → global reveal envelope (alpha gated by intensity so
    // the harness's brightness multiplier is actually respected).
    u.uReveal.value = damp(u.uReveal.value, dendriteGrowth, 2.0, dt);
    u.uRevealAlpha.value = (0.45 + 0.55 * u.uReveal.value) * intensityMult;

    // spikeActive → charge boost (brightness/size → crosses bloom subtly).
    u.uCharge.value = damp(u.uCharge.value, spikeActive * intensityMult, 2.5, dt);

    // uSize is the base point size — scaled by intensity as well.
    u.uSize.value = (mobile ? 0.042 : 0.05) * intensityMult;

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

    // Field rig — slow Y spin + damped scroll-driven tilt.
    const group = groupRef.current;
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
