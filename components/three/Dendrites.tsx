'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { dendriteFragment, dendriteVertex } from './shaders/dendrite';
import { useNeuronStore } from '@/lib/neuron-store';
import { COLORS, damp, hexToRGB } from '@/lib/constants';
import type { DendriteBranch } from '@/lib/dendrite-builder';

interface DendritesProps {
  branches: DendriteBranch[];
}

export function Dendrites({ branches }: DendritesProps) {
  return (
    <group>
      {branches.map((b, i) => (
        <Dendrite key={i} curve={b.curve} index={i} />
      ))}
    </group>
  );
}

function Dendrite({ curve, index }: { curve: THREE.CatmullRomCurve3; index: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const growthRef = useRef(0);

  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, 48, 0.03, 8, false),
    [curve]
  );

  const uniforms = useMemo(
    () => ({
      uGrowth:        { value: 0 },
      uTime:          { value: 0 },
      uStdpIntensity: { value: 0 },
      uWave:          { value: -0.1 },
      uColor:         { value: new THREE.Color(...hexToRGB(COLORS.cyan)) },
      uTipColor:      { value: new THREE.Color(...hexToRGB(COLORS.cyanGlow)) },
    }),
    []
  );

  // Stagger: dendrites farther from index 0 fire slightly later.
  // 0.04s × index gives ~720ms total fan-out across 18 dendrites —
  // long enough to look like propagation, short enough to feel snappy.
  const AP_TRAVEL_TIME = 0.55; // seconds for wave to cross full dendrite
  const STAGGER = 0.04;        // seconds between each dendrite firing

  const stagger = (index % 6) * 0.04;

  useFrame((state, dt) => {
    if (!matRef.current) return;
    const store = useNeuronStore.getState();

    // Growth reveal (scroll-driven).
    const target = Math.max(0, Math.min(1, store.target.dendriteGrowth - stagger));
    growthRef.current = damp(growthRef.current, target, 2.4, dt);
    matRef.current.uniforms.uGrowth.value = growthRef.current;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    matRef.current.uniforms.uStdpIntensity.value = store.target.stdpIntensity;

    // AP wave (click-driven).
    const apTime = store.apTriggerTime;
    if (apTime >= 0) {
      const elapsed = state.clock.elapsedTime - apTime;
      const delay = index * STAGGER;
      const wave = (elapsed - delay) / AP_TRAVEL_TIME;
      // Hold at 1.2 after the wave passes so it doesn't snap to idle mid-flash;
      // the exp() falloff in the shader makes values > 1.1 invisible anyway.
      matRef.current.uniforms.uWave.value = Math.min(wave, 1.2);
    } else {
      matRef.current.uniforms.uWave.value = -0.1;
    }
  });

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        vertexShader={dendriteVertex}
        fragmentShader={dendriteFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}