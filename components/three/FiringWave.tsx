'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import {
  FiringWaveSystem,
  MAX_WAVES,
  WAVE_CENTERS,
  WAVE_FLOATS,
} from '@/lib/firing-wave';
import {
  firingWaveFragmentShader,
  firingWaveVertexShader,
} from '@/lib/firing-wave-shaders';
import { useSectionStore, previewUi } from '@/lib/section-store';
import { COLORS, clamp, damp, hexToRGB } from '@/lib/constants';
import { sections } from '@/data/sections';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Props {
  mobile?: boolean;
}

/**
 * The B3 background subject: firing waves / EEG oscilloscope.
 *
 * One camera-facing plane (z ≈ 0) whose fragment shader paints concentric
 * SDF ring wavefronts sampled from a per-frame wave DataTexture, plus two
 * faint traveling oscilloscope traces and dim ember glows at the six focal
 * centers. Everything is simulated CPU-side in lib/firing-wave.ts (a small
 * ring buffer of wave events) and packed into the texture every frame — the
 * per-frame cost is O(live waves), not O(pixels).
 *
 * Section reactivity reuses the scroll store's phase values, damped into
 * uniforms inside useFrame (store read via getState, no re-renders):
 *
 *   firingRate    → wave emission rate + expansion speed (sim, CPU side)
 *   stdpIntensity → uStdp, EEG-trace amplitude (activity shimmer)
 *   dendriteGrowth→ uGlobalAlpha reveal envelope (global fade-in)
 *   spikeActive   → "action potentials": bright fast AP rings from the
 *                   active focus (rising-edge burst + periodic while high)
 *                   plus a decaying uSpikeGlow flash
 *   section index → which focus fires hardest + uAccentMix cyan → mint drift
 *   rotation      → uTilt, slow sway of the ring field (traces stay fixed)
 *   previewUi     → intensity scales uGlobalAlpha, speed scales time
 *
 * Composition (the B2 "no hole" lesson): the six foci are scattered
 * off-center and ALL of them emit ambient rings at staggered cadences, so
 * the canvas always has motion everywhere and rings from the quadrant foci
 * cross the view axis at low density — the center is intentional negative
 * space, not a dead void. A gentle uCenterAtten keeps the content corridor
 * readable without zeroing it.
 *
 * Reduced motion: the sim is frozen (no emission, no time advance) and the
 * pre-seeded ambient field renders as a calm static ring composition.
 * Mobile: fewer live waves, dimmer field; Bloom/Vignette are off anyway.
 */
export function FiringWave({ mobile = false }: Props) {
  const reduced = useReducedMotion();

  // Simulation state — created once, updated in useFrame, never via React.
  const systemRef = useRef<FiringWaveSystem | null>(null);
  if (systemRef.current === null) {
    const sys = new FiringWaveSystem();
    sys.mobile = mobile;
    sys.seedAmbient(); // calm static rings for the first frame + reduced motion
    systemRef.current = sys;
  }
  useEffect(() => {
    if (systemRef.current) systemRef.current.mobile = mobile;
  }, [mobile]);

  // 2 texels per wave (RGBA floats): A = (cx, cy, birth, growth),
  // B = (maxR, brightness, mix, thickness). Height is always MAX_WAVES so
  // the shader's fixed loop bound matches on desktop and mobile. `packed`
  // IS the texture's image data — the sim mutates it in place every frame.
  const packed = useMemo(() => new Float32Array(MAX_WAVES * WAVE_FLOATS), []);
  const texture = useMemo(() => {
    const tex = new THREE.DataTexture(
      packed,
      2,
      MAX_WAVES,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }, [packed]);

  useEffect(() => () => texture.dispose(), [texture]);

  // Stable uniform targets — mutated in useFrame, never via React state.
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: 1 },
      uGlobalAlpha: { value: 0.55 },
      uAccentMix: { value: 0 },
      uStdp: { value: 0 },
      uTilt: { value: 0 },
      uHalfW: { value: 4 },
      uHalfH: { value: 2.28 },
      uActiveCenter: { value: new THREE.Vector2(0, 0) },
      uActiveBright: { value: 0.2 },
      uSpikeGlow: { value: 0 },
      uCyan: { value: new THREE.Color(...hexToRGB(COLORS.cyan)) },
      uMint: { value: new THREE.Color(...hexToRGB(COLORS.mint)) },
      uWavesTex: { value: texture },
      uCenters: { value: WAVE_CENTERS.map((c) => new THREE.Vector2(c.nx, c.ny)) },
      uCenterTints: { value: WAVE_CENTERS.map((c) => c.tint) },
    }),
    [texture],
  );

  // Damped reactive refs.
  const tiltRef = useRef(0);
  const accentRef = useRef(0);
  const stdpRef = useRef(0);
  const alphaRef = useRef(0.55);
  const activeBrightRef = useRef(0.2);
  const spikeGlowRef = useRef(0);
  const lastSpikeRef = useRef(useSectionStore.getState().target.spikeActive);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05); // clamp long frames (tab switch)
    const store = useSectionStore.getState();
    const { firingRate, stdpIntensity, spikeActive, dendriteGrowth, rotation } =
      store.target;
    // Guard: WAVE_CENTERS has one entry per section — clamp so a section
    // added to data/sections.ts without a matching focus can't crash the rig.
    const section = Math.min(store.section, WAVE_CENTERS.length - 1);
    const { intensity, speed } = previewUi;

    // Live frustum half-extents (Scene camera: fov 45, dollies on cameraZ).
    const camZ = state.camera.position.z;
    const halfH = Math.tan((45 * Math.PI) / 360) * camZ;
    const halfW = halfH * (state.size.width / Math.max(1, state.size.height));

    // Damped reactive values.
    tiltRef.current = damp(tiltRef.current, clamp(rotation, -0.35, 0.35), 1.6, dt);
    accentRef.current = damp(
      accentRef.current,
      section / Math.max(1, sections.length - 1),
      2,
      dt,
    );
    stdpRef.current = damp(stdpRef.current, stdpIntensity, 2, dt);
    alphaRef.current = damp(
      alphaRef.current,
      (0.42 + 0.58 * dendriteGrowth) * intensity * (mobile ? 0.85 : 1),
      2,
      dt,
    );
    activeBrightRef.current = damp(
      activeBrightRef.current,
      0.12 + 0.26 * (0.45 + 0.55 * dendriteGrowth),
      2,
      dt,
    );

    const focus = WAVE_CENTERS[section];

    // Advance the sim (skipped under reduced motion — frozen static field).
    const sys = systemRef.current;
    if (sys) {
      if (!reduced) {
        // Spike rising edge → an immediate action potential + glow flash.
        if (spikeActive >= 0.5 && lastSpikeRef.current < 0.5) {
          sys.fireSpike(section, accentRef.current, firingRate);
          spikeGlowRef.current = 1;
        }
        lastSpikeRef.current = spikeActive;
        spikeGlowRef.current *= Math.exp(-dt * 2.2);

        sys.update(dt, {
          firingRate,
          section,
          spikeActive,
          speedMult: speed,
          accent: accentRef.current,
          mobile,
        });
      } else {
        lastSpikeRef.current = spikeActive;
        spikeGlowRef.current = 0;
      }

      // Pack the live waves into the DataTexture (mutates `packed` in place).
      sys.pack(packed, { x: halfW, y: halfH });
      texture.needsUpdate = true;
    }

    // Write uniforms.
    const u = uniforms;
    u.uTime.value = reduced ? 0 : (sys?.simTime ?? 0);
    u.uSpeed.value = speed;
    u.uGlobalAlpha.value = alphaRef.current;
    u.uAccentMix.value = accentRef.current;
    u.uStdp.value = stdpRef.current;
    u.uTilt.value =
      tiltRef.current + (reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.12) * 0.05);
    u.uHalfW.value = halfW;
    u.uHalfH.value = halfH;
    u.uActiveCenter.value.set(focus.nx * halfW, focus.ny * halfH);
    u.uActiveBright.value = activeBrightRef.current;
    u.uSpikeGlow.value = spikeGlowRef.current;
  });

  return (
    <mesh position={[0, 0, -0.4]} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={firingWaveVertexShader}
        fragmentShader={firingWaveFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}
