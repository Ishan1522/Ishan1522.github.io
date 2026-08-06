'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { FlowField } from './FlowField';
import { Effects } from './Effects';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSectionStore, previewUi } from '@/lib/section-store';
import { COLORS, damp } from '@/lib/constants';

/**
 * The WebGL canvas. Positioned fixed behind the rest of the page via CSS.
 *
 * Camera dollies in/out based on the active section's `cameraZ` target.
 * Background is set as scene.background for a non-transparent fill that
 * still respects post-processing.
 *
 * Subject: FlowField (B2) — a curl-noise particle flow field. The shell
 * (camera rig, fog, effects, fallback) is shared infrastructure.
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
        scene.fog = new THREE.FogExp2(COLORS.bg, 0.045);
      }}
    >
      <CameraRig />
      <UiRig />
      <Suspense fallback={null}>
        <FlowField mobile={mobile} />
      </Suspense>
      <Effects mobile={mobile} />
    </Canvas>
  );
}

/**
 * Damps the preview harness's UI multipliers (`ui.intensity` / `ui.speed`)
 * into the shared `previewUi` object every frame. Background subjects read
 * `previewUi` (not the raw store values) so the multiplier works regardless
 * of which background is on the branch. On the main page the store values
 * are always 1, making this a no-op.
 */
function UiRig() {
  useFrame((_, dt) => {
    const { intensity, speed } = useSectionStore.getState().ui;
    previewUi.intensity = damp(previewUi.intensity, intensity, 3, dt);
    previewUi.speed = damp(previewUi.speed, speed, 3, dt);
  });
  return null;
}

/**
 * Camera rig — damps the camera's Z toward the active section's target.
 * Keeps X/Y at 0 (the flow field stays centered). A touch of breathing on Y.
 */
function CameraRig() {
  const zRef = useRef(5.5);

  useFrame(({ camera, clock }, dt) => {
    const target = useSectionStore.getState().target.cameraZ;
    zRef.current = damp(zRef.current, target, 1.6, dt);
    camera.position.z = zRef.current;
    camera.position.y = Math.sin(clock.elapsedTime * 0.3) * 0.08;
    camera.lookAt(0, 0, 0);
  });
  return null;
}
