'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { somaFragment, somaVertex } from './shaders/soma';
import { useNeuronStore } from '@/lib/neuron-store';
import { COLORS, damp, hexToRGB } from '@/lib/constants';

/**
 * Soma — the cell body.
 * A subdivided icosahedron with a custom Fresnel/pulse shader.
 * Damps its own firing rate toward the store's target each frame.
 */
export function Soma() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const firingRef = useRef(0); // locally damped firing rate

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFiringRate: { value: 0 },
      uColorCore: { value: new THREE.Color(...hexToRGB(COLORS.cyanDeep)) },
      uColorRim: { value: new THREE.Color(...hexToRGB(COLORS.cyanGlow)) },
    }),
    []
  );

  useFrame((state, dt) => {
    if (!materialRef.current) return;
    const target = useNeuronStore.getState().target.firingRate;
    firingRef.current = damp(firingRef.current, target, 3, dt);
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uFiringRate.value = firingRef.current;
  });

  return (
    <mesh>
      <icosahedronGeometry args={[0.45, 5]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={somaVertex}
        fragmentShader={somaFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
