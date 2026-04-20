'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { somaFragment, somaVertex } from './shaders/soma';
import { useNeuronStore } from '@/lib/neuron-store';
import { COLORS, damp, hexToRGB } from '@/lib/constants';

export function Soma() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const firingRef = useRef(0);
  const hoverRef = useRef(0);      // damped 0→1 for smooth brighten
  const elapsedRef = useRef(0);    // captures clock each frame for click handler

  const uniforms = useMemo(
    () => ({
      uTime:        { value: 0 },
      uFiringRate:  { value: 0 },
      uHover:       { value: 0 },
      uColorCore:   { value: new THREE.Color(...hexToRGB(COLORS.cyanDeep)) },
      uColorRim:    { value: new THREE.Color(...hexToRGB(COLORS.cyanGlow)) },
    }),
    []
  );

  useFrame((state, dt) => {
    if (!materialRef.current) return;
    const store = useNeuronStore.getState();

    elapsedRef.current = state.clock.elapsedTime;

    // Damp firing rate toward scroll target + hover boost.
    const targetFiring = store.target.firingRate + (store.hovered ? 0.4 : 0);
    firingRef.current = damp(firingRef.current, targetFiring, 3, dt);

    // Damp hover intensity for smooth enter/leave feel.
    hoverRef.current = damp(hoverRef.current, store.hovered ? 1 : 0, 6, dt);

    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uFiringRate.value = firingRef.current;
    materialRef.current.uniforms.uHover.value = hoverRef.current;
  });

  return (
    <mesh
      onPointerOver={() => {
  console.log('hovered!');
  useNeuronStore.getState().setHovered(true);
}}
      onPointerOut={()  => useNeuronStore.getState().setHovered(false)}
      onClick={()       => useNeuronStore.getState().triggerAP(elapsedRef.current)}
    >
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