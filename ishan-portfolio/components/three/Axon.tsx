'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { dendriteFragment, dendriteVertex } from './shaders/dendrite';
import { spikeFragment, spikeVertex } from './shaders/spike';
import { useNeuronStore } from '@/lib/neuron-store';
import { COLORS, damp, hexToRGB } from '@/lib/constants';

/**
 * Axon + action potential.
 *
 * The axon is a single long curve from the soma out to the lower-right.
 * The spike is a small emissive sphere that rides the curve — its position
 * is `(t * speed) mod 1` where speed scales with firingRate.
 */
export function Axon() {
  // Define a fixed, aesthetic axon curve (not random — this one should feel
  // deliberate, like the axon in a textbook diagram).
  const axonCurve = useMemo(() => {
    const pts = [
      new THREE.Vector3(0.7, -0.3, 0.0),
      new THREE.Vector3(1.6, -0.9, 0.3),
      new THREE.Vector3(2.6, -1.3, -0.2),
      new THREE.Vector3(3.7, -1.6, 0.1),
      new THREE.Vector3(4.8, -1.8, -0.1),
    ];
    return new THREE.CatmullRomCurve3(pts);
  }, []);

  const axonGeometry = useMemo(
    () => new THREE.TubeGeometry(axonCurve, 80, 0.045, 8, false),
    [axonCurve]
  );

  const axonMatRef = useRef<THREE.ShaderMaterial>(null);
  const spikeRef = useRef<THREE.Mesh>(null);
  const spikeMatRef = useRef<THREE.ShaderMaterial>(null);
  const growthRef = useRef(0);
  const spikeActiveRef = useRef(0);

  const axonUniforms = useMemo(
    () => ({
      uGrowth: { value: 0 },
      uTime: { value: 0 },
      uStdpIntensity: { value: 0 },
      uColor: { value: new THREE.Color(...hexToRGB(COLORS.cyan)) },
      uTipColor: { value: new THREE.Color(...hexToRGB(COLORS.cyanGlow)) },
    }),
    []
  );

  const spikeUniforms = useMemo(
    () => ({
      uIntensity: { value: 0 },
      uColor: { value: new THREE.Color(...hexToRGB(COLORS.cyanGlow)) },
    }),
    []
  );

  useFrame((state, dt) => {
    const store = useNeuronStore.getState();

    // Axon grows in lockstep with dendrites but a hair behind.
    if (axonMatRef.current) {
      const target = Math.max(0, store.target.dendriteGrowth - 0.05);
      growthRef.current = damp(growthRef.current, target, 2.2, dt);
      axonMatRef.current.uniforms.uGrowth.value = growthRef.current;
      axonMatRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      axonMatRef.current.uniforms.uStdpIntensity.value = store.target.stdpIntensity;
    }

    // Spike propagates when spikeActive > 0.
    spikeActiveRef.current = damp(spikeActiveRef.current, store.target.spikeActive, 3, dt);
    if (spikeRef.current && spikeMatRef.current) {
      const speed = 0.35 + store.target.firingRate * 0.6;
      const t = (state.clock.elapsedTime * speed) % 1;
      // Only show spike once axon has grown past where it currently is.
      const visible = t <= growthRef.current ? 1 : 0;
      const intensity = spikeActiveRef.current * visible;
      spikeMatRef.current.uniforms.uIntensity.value = intensity;
      const pos = axonCurve.getPoint(t);
      spikeRef.current.position.copy(pos);
      // Scale down when barely active so it fades in/out cleanly.
      const scale = 0.08 + spikeActiveRef.current * 0.04;
      spikeRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      <mesh geometry={axonGeometry}>
        <shaderMaterial
          ref={axonMatRef}
          vertexShader={dendriteVertex}
          fragmentShader={dendriteFragment}
          uniforms={axonUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={spikeRef}>
        <sphereGeometry args={[1, 20, 20]} />
        <shaderMaterial
          ref={spikeMatRef}
          vertexShader={spikeVertex}
          fragmentShader={spikeFragment}
          uniforms={spikeUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
