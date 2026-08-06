'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { buildConstellationLayout, smoothstep } from '@/lib/constellation';
import { useSectionStore } from '@/lib/section-store';
import { COLORS, clamp, damp, hexToRGB } from '@/lib/constants';
import { sections } from '@/data/sections';

interface Props {
  mobile?: boolean;
}

/** One hub per section — module-scope constant (never changes at runtime). */
const HUB_COUNT = sections.length;

/**
 * The knowledge-graph constellation.
 *
 * A ring of hub nodes (one per portfolio section) plus satellites, joined
 * by thin additive edges. Section reactivity works by index: hub `i`
 * corresponds to `sections[i]`, and when the scroll store's `section`
 * matches, that hub brightens and the charge pulses traveling its edges
 * intensify. Everything is damped in `useFrame` toward the store's phase
 * targets, so no React re-renders happen at 60Hz.
 *
 * Hub/edge brightness is kept low (base ~0.1-0.3) so the background stays
 * dimmer than the content layer; only the active hub crosses the Bloom
 * threshold. The graph is biased toward the viewport periphery — the
 * center of the canvas is deliberately left clear.
 */
export function Constellation({ mobile = false }: Props) {
  const { size } = useThree();
  const aspect = size.height > 0 ? size.width / size.height : 1.6;

  const satelliteCount = mobile ? 6 : 14;
  const layout = useMemo(
    () => buildConstellationLayout(HUB_COUNT, { satelliteCount, chords: !mobile }, aspect),
    [satelliteCount, aspect, mobile],
  );

  const groupRef = useRef<THREE.Group>(null);
  const hubRef = useRef<THREE.InstancedMesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const tiltRef = useRef(0);
  // Per-hub energy, damped toward active/idle each frame.
  const energies = useRef<number[]>(Array.from({ length: HUB_COUNT }, () => 0.1));

  // Reusable scratch colors/object (no per-frame allocation).
  const dimColor = useMemo(() => new THREE.Color(...hexToRGB(COLORS.cyanDeep)), []);
  const idleColor = useMemo(() => new THREE.Color(...hexToRGB(COLORS.cyan)), []);
  const brightColor = useMemo(() => new THREE.Color(...hexToRGB(COLORS.mintGlow)), []);
  const workColor = useMemo(() => new THREE.Color(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const edgeGeometry = useMemo(() => {
    const verts = new Float32Array(layout.edges.length * 6);
    layout.edges.forEach((e, i) => {
      const a = layout.nodes[e.a].position;
      const b = layout.nodes[e.b].position;
      verts[i * 6] = a.x;
      verts[i * 6 + 1] = a.y;
      verts[i * 6 + 2] = a.z;
      verts[i * 6 + 3] = b.x;
      verts[i * 6 + 4] = b.y;
      verts[i * 6 + 5] = b.z;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    const colAttr = new THREE.BufferAttribute(new Float32Array(layout.edges.length * 6), 3);
    colAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('color', colAttr);
    return geo;
  }, [layout]);

  // Seed instance colors once so the first frame isn't white.
  useEffect(() => {
    const mesh = hubRef.current;
    if (!mesh) return;
    for (let i = 0; i < HUB_COUNT; i++) {
      mesh.setColorAt(i, dimColor);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [dimColor]);

  useFrame((state, dt) => {
    const store = useSectionStore.getState();
    const t = state.clock.elapsedTime;
    const { section } = store;
    const { rotation, firingRate, stdpIntensity, spikeActive, dendriteGrowth } = store.target;

    // Field "assembly" (scroll reveal) and charge boost from the phase data.
    const reveal = 0.45 + 0.55 * dendriteGrowth;
    const charge = 0.55 + 0.45 * spikeActive;

    // 1. Damp per-hub energy toward active/idle.
    for (let i = 0; i < HUB_COUNT; i++) {
      const target = i === section ? 1 : 0.08;
      energies.current[i] = damp(energies.current[i], target, 3.2, dt);
    }

    // 2. Hub nodes — scale + instance color (dim → bright mint when active).
    const mesh = hubRef.current;
    if (mesh) {
      for (let i = 0; i < HUB_COUNT; i++) {
        const e = energies.current[i];
        // STDP-like shimmer makes the population feel alive between sections.
        const shimmer = 0.85 + 0.15 * Math.sin(t * 1.8 + i * 1.7) * (0.4 + stdpIntensity * 0.6);
        const b = (0.16 + 0.1 * reveal) + e * 1.15 * shimmer * charge;
        workColor.copy(idleColor).lerp(brightColor, e);
        color.copy(workColor).multiplyScalar(b);

        dummy.position.copy(layout.nodes[i].position);
        dummy.scale.setScalar(0.065 + e * 0.05);
        dummy.rotation.set(0, t * 0.4 + i, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, color);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    // 3. Edges — per-vertex colors: a bright charge blip travels each edge,
    //    gated by the energy of the hubs it connects.
    const line = lineRef.current;
    if (line) {
      const colAttr = line.geometry.getAttribute('color') as THREE.BufferAttribute;
      const arr = colAttr.array as Float32Array;
      const speed = 0.35 + firingRate * 0.9;
      layout.edges.forEach((e, i) => {
        const ea = e.a < HUB_COUNT ? energies.current[e.a] : 0;
        const eb = e.b < HUB_COUNT ? energies.current[e.b] : 0;
        const energy = Math.max(ea, eb);
        for (let v = 0; v < 2; v++) {
          const ph = (t * speed - v) % 1;
          const p = ph < 0 ? ph + 1 : ph;
          const blip = smoothstep(0, 0.12, p) * (1 - smoothstep(0.12, 0.35, p));
          const b = 0.055 + energy * (0.1 * reveal + blip * (0.9 + charge * 0.8));
          workColor.copy(idleColor).lerp(brightColor, clamp(energy * 0.9, 0, 1));
          const idx = i * 6 + v * 3;
          arr[idx] = workColor.r * b;
          arr[idx + 1] = workColor.g * b;
          arr[idx + 2] = workColor.b * b;
        }
      });
      colAttr.needsUpdate = true;
    }

    // 4. Field rig — slow rotation + scroll-driven tilt + gentle breathing.
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * (mobile ? 0.045 : 0.065);
      tiltRef.current = damp(tiltRef.current, rotation, 1.8, dt);
      groupRef.current.rotation.x = tiltRef.current;
      groupRef.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.012);
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={hubRef}
        args={[undefined, undefined, HUB_COUNT]}
        frustumCulled={false}
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>
      <lineSegments ref={lineRef} geometry={edgeGeometry}>
        <lineBasicMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexColors
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}
