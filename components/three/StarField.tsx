'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { COLORS, hexToRGB } from '@/lib/constants';
import { useSectionStore } from '@/lib/section-store';

interface Props {
  count?: number;
  radius?: number;
}

/**
 * Ambient star field — the "dots" of the constellation.
 *
 * Rendered as a single THREE.Points cloud. Each star has a static base
 * color (mostly cyan, a few mint) and a random twinkle phase; the color
 * attribute is rewritten per-frame so stars breathe at different rates
 * (cheap — ~150-500 writes). The whole cloud rotates slowly, at a
 * slightly different rate than the constellation graph, which reads as
 * parallax depth separation. Depth fog fades distant stars into the bg.
 */
export function StarField({ count = 520, radius = 7 }: Props) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, phases, baseColors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const baseColors = new Float32Array(count * 3);
    const cyan = hexToRGB(COLORS.cyan);
    const mint = hexToRGB(COLORS.mintDeep);
    for (let i = 0; i < count; i++) {
      // Random point inside sphere (rejection sampling).
      let x = 0, y = 0, z = 0;
      do {
        x = (Math.random() - 0.5) * 2;
        y = (Math.random() - 0.5) * 2;
        z = (Math.random() - 0.5) * 2;
      } while (x * x + y * y + z * z > 1);
      positions[i * 3] = x * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = z * radius;

      phases[i] = Math.random();

      // ~3/4 cyan, 1/4 deep-mint — keeps the palette muted.
      const base = Math.random() < 0.75 ? cyan : mint;
      baseColors[i * 3] = base[0];
      baseColors[i * 3 + 1] = base[1];
      baseColors[i * 3 + 2] = base[2];
    }
    return { positions, phases, baseColors };
  }, [count, radius]);

  useFrame((state, dt) => {
    const points = pointsRef.current;
    if (!points) return;

    // Slow drift so the field feels alive even without scrolling.
    points.rotation.y += dt * 0.02;
    points.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.05;

    const t = state.clock.elapsedTime;
    const reveal = 0.55 + 0.45 * useSectionStore.getState().target.dendriteGrowth;

    const colAttr = points.geometry.attributes.color as THREE.BufferAttribute;
    const col = colAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const twinkle =
        0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * (0.8 + phases[i] * 1.3) + phases[i] * 6.283));
      const b = 0.08 + 0.3 * twinkle * reveal;
      col[i * 3] = baseColors[i * 3] * b;
      col[i * 3 + 1] = baseColors[i * 3 + 1] * b;
      col[i * 3 + 2] = baseColors[i * 3 + 2] * b;
    }
    colAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={baseColors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        vertexColors
        color="#ffffff"
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
