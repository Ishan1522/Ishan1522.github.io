'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { Neuron } from './Neuron';
import { AmbientParticles } from './AmbientParticles';
import { Effects } from './Effects';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useNeuronStore } from '@/lib/neuron-store';
import { COLORS, damp, hexToRGB } from '@/lib/constants';

/**
 * The WebGL canvas. Positioned fixed behind the rest of the page via CSS.
 *
 * Camera dollies in/out based on the active section's `cameraZ` target.
 * Background is set as scene.background for a non-transparent fill that
 * still respects post-processing.
 */
export function Scene() {
  const mobile = useIsMobile();

  return (
    <Canvas
      dpr={mobile ? [1, 1.5] : [1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      camera={{ position: [0, 0, 5.5], fov: 45, near: 0.1, far: 100 }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(COLORS.bg, 1);
        scene.fog = new THREE.FogExp2(COLORS.bg, 0.04);
      }}
    >
      <CameraRig />
      <ambientLight intensity={0.08} color={COLORS.cyan} />
      <pointLight
        position={[3, 4, 5]}
        intensity={0.6}
        color={new THREE.Color(...hexToRGB(COLORS.cyan))}
      />
      <pointLight
        position={[-4, -2, 3]}
        intensity={0.35}
        color={new THREE.Color(...hexToRGB(COLORS.mint))}
      />
      <Suspense fallback={null}>
        {!mobile && <AmbientParticles count={400} />}
        {mobile && <AmbientParticles count={120} />}
        <Neuron mobile={mobile} />
      </Suspense>
      <Effects mobile={mobile} />
    </Canvas>
  );
}

/**
 * Camera rig — damps the camera's Z toward the active section's target.
 * Keeps X/Y at 0 (neuron stays centered). A touch of breathing on Y.
 */
function CameraRig() {
  const zRef = useRef(5.5);

  useFrame(({ camera, clock }, dt) => {
    const target = useNeuronStore.getState().target.cameraZ;
    zRef.current = damp(zRef.current, target, 1.6, dt);
    camera.position.z = zRef.current;
    camera.position.y = Math.sin(clock.elapsedTime * 0.3) * 0.08;
    camera.lookAt(0, 0, 0);
  });
  return null;
}
