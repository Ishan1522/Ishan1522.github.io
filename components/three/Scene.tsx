'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { Aurora } from './Aurora';
import { Effects } from './Effects';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSectionStore, previewUi, SPEED_MAX } from '@/lib/section-store';
import { COLORS, clamp, damp } from '@/lib/constants';

/**
 * The WebGL canvas. Positioned fixed behind the rest of the page via CSS.
 *
 * Camera dollies in/out based on the active section's `cameraZ` target.
 * Background is set as scene.background for a non-transparent fill that
 * still respects post-processing.
 *
 * Subject: Aurora (B4) — layered domain-warped noise "curtain" gradients
 * on a shader plane. The shell (camera rig, fog, effects, fallback) is
 * shared infrastructure.
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
        <Aurora mobile={mobile} />
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
    // Effective speed is hard-clamped so the harness can't push the drift
    // clock into a whip (scroll-spaz hardening — see SPEED_MAX).
    previewUi.speed = clamp(
      damp(previewUi.speed, speed, 3, dt),
      0.1,
      SPEED_MAX,
    );
  });
  return null;
}

/**
 * Camera rig — damps the camera's Z toward the active section's target.
 * Keeps X/Y at 0 (the aurora plane stays centered). A touch of breathing on Y.
 *
 * The dolly is deliberately softened: the section `cameraZ` target is
 * scaled to 70% of its data range and damped slowly (λ1.2) so the physical
 * push/pull stays subtle. A hard dolly + the field tilt compounded into an
 * apparent sideways drift of the whole cloud while scrolling.
 *
 * Scroll-spaz hardening: on top of the slow damping, the per-frame cameraZ
 * delta is hard-clamped (MAX_DOLLY_DELTA) and the target itself is clamped
 * to the section data range, so even a violent fast scroll flick can only
 * produce a controlled glide — the camera never whips. A whipping dolly
 * shifts the NDC half-extents in Aurora.tsx rapidly, which visibly warps
 * the whole field.
 */
const MAX_DOLLY_DELTA = 0.05; // world units per frame (~3 u/s at 60fps cap)
const DOLLY_LAMBDA = 0.85; // slower than before (1.2) — more damping

function CameraRig() {
  const zRef = useRef(5.5);

  useFrame(({ camera, clock }, dt) => {
    const target = useSectionStore.getState().target.cameraZ;
    const dolly = 5.5 + (target - 5.5) * 0.7;
    const next = damp(zRef.current, dolly, DOLLY_LAMBDA, dt);
    // Hard per-frame speed limit — the dolly glides, never whips.
    const delta = next - zRef.current;
    const clampedDelta = clamp(delta, -MAX_DOLLY_DELTA, MAX_DOLLY_DELTA);
    zRef.current += clampedDelta;
    camera.position.z = zRef.current;
    camera.position.y = Math.sin(clock.elapsedTime * 0.3) * 0.08;
    camera.lookAt(0, 0, 0);
  });
  return null;
}
