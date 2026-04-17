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

/** Renders one <Dendrite> per branch. */
export function Dendrites({ branches }: DendritesProps) {
  return (
    <group>
      {branches.map((b, i) => (
        <Dendrite key={i} curve={b.curve} index={i} />
      ))}
    </group>
  );
}

/** Single dendrite — tube geometry + growth shader. */
function Dendrite({ curve, index }: { curve: THREE.CatmullRomCurve3; index: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const growthRef = useRef(0);

  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, 48, 0.03, 8, false),
    [curve]
  );

  const uniforms = useMemo(
    () => ({
      uGrowth: { value: 0 },
      uTime: { value: 0 },
      uStdpIntensity: { value: 0 },
      uColor: { value: new THREE.Color(...hexToRGB(COLORS.cyan)) },
      uTipColor: { value: new THREE.Color(...hexToRGB(COLORS.cyanGlow)) },
    }),
    []
  );

  // Stagger growth so dendrites don't all emerge in lockstep.
  const stagger = (index % 6) * 0.04;

  useFrame((state, dt) => {
    if (!matRef.current) return;
    const store = useNeuronStore.getState();
    const target = Math.max(0, Math.min(1, store.target.dendriteGrowth - stagger));
    growthRef.current = damp(growthRef.current, target, 2.4, dt);
    matRef.current.uniforms.uGrowth.value = growthRef.current;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    matRef.current.uniforms.uStdpIntensity.value = store.target.stdpIntensity;
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
