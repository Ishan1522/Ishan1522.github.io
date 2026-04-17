'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useNeuronStore } from '@/lib/neuron-store';
import { COLORS, hexToRGB } from '@/lib/constants';
import type { DendriteBranch } from '@/lib/dendrite-builder';

interface SynapsesProps {
  branches: DendriteBranch[];
}

/**
 * Synapses — one per dendrite tip. Rendered as InstancedMesh for efficiency.
 *
 * Each synapse has a phase offset so they don't all flicker in unison.
 * Brightness scales with the store's `stdpIntensity` — rewiring looks like
 * asymmetric strengthening/weakening across the population.
 */
export function Synapses({ branches }: SynapsesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const growthRef = useRef(0); // so synapses only appear after dendrites reach their tips

  const { positions, phases, strengths } = useMemo(() => {
    const positions = branches.map((b) => b.tipPosition);
    const phases = branches.map((_, i) => (i * 0.618) % 1); // golden-ratio scatter
    // Asymmetric strength distribution — STDP doesn't affect all synapses equally.
    const strengths = branches.map((_, i) => 0.4 + ((i * 0.37) % 1) * 0.6);
    return { positions, phases, strengths };
  }, [branches]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const cyanC = useMemo(() => new THREE.Color(...hexToRGB(COLORS.cyan)), []);
  const mintC = useMemo(() => new THREE.Color(...hexToRGB(COLORS.mintGlow)), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const store = useNeuronStore.getState();
    const t = state.clock.elapsedTime;
    const stdp = store.target.stdpIntensity;
    const growth = store.target.dendriteGrowth;

    // Synapses fade in as dendrites approach full length.
    growthRef.current = Math.max(0, (growth - 0.85) / 0.15);
    const appear = growthRef.current;

    positions.forEach((pos, i) => {
      const phase = phases[i];
      const strength = strengths[i];
      // Per-synapse pulse — frequency ramps with STDP.
      const pulse = 0.5 + 0.5 * Math.sin(t * (1.2 + stdp * 4) + phase * 6.283);
      const scale = 0.05 + 0.06 * pulse * (0.4 + stdp * 0.8) * appear;
      dummy.position.copy(pos);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // Color shifts toward mint as STDP strengthens this synapse.
      const mix = Math.min(1, stdp * strength * 1.4);
      color.copy(cyanC).lerp(mintC, mix);
      meshRef.current!.setColorAt(i, color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, positions.length]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
