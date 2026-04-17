'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { Soma } from './Soma';
import { Dendrites } from './Dendrites';
import { Axon } from './Axon';
import { Synapses } from './Synapses';
import { buildDendrites } from '@/lib/dendrite-builder';
import { useNeuronStore } from '@/lib/neuron-store';
import { damp } from '@/lib/constants';

interface Props {
  mobile?: boolean;
}

/**
 * The complete neuron.
 *
 * One group that owns soma + dendrites + axon + spike + synapses.
 * Rotation and scroll-driven tilt applied at the group level so the
 * whole assembly moves together.
 *
 * The dendritic tree is generated once here with buildDendrites() and
 * the tip positions are handed to Synapses so they always land on the
 * exact dendrite endpoints.
 */
export function Neuron({ mobile = false }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const rotationRef = useRef(0);

  // Fewer dendrites on mobile — halves the tube-geometry cost.
  const dendriteCount = mobile ? 10 : 18;
  const branches = useMemo(() => buildDendrites(dendriteCount), [dendriteCount]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    const store = useNeuronStore.getState();

    // Slow auto-rotation gives the neuron life even when the user isn't scrolling.
    groupRef.current.rotation.y += dt * 0.08;

    // Scroll-driven tilt damped for smoothness.
    rotationRef.current = damp(rotationRef.current, store.target.rotation, 2.0, dt);
    groupRef.current.rotation.x = rotationRef.current;

    // Gentle breathing on Z-axis from combined pulse + firing.
    const breath = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.015;
    groupRef.current.scale.setScalar(breath);
  });

  return (
    <group ref={groupRef}>
      <Soma />
      <Dendrites branches={branches} />
      <Axon />
      <Synapses branches={branches} />
    </group>
  );
}
