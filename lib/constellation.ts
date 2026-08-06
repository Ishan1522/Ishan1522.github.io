/**
 * Constellation field layout generator.
 *
 * Builds a deterministic knowledge-graph layout for the background:
 * a ring of "hub" nodes (one per portfolio section, matching the section
 * index in `data/sections.ts`) plus scattered satellite nodes, all joined
 * by edges. The whole graph lives on the periphery of the view volume so
 * the center of the canvas stays clear for the content layer.
 *
 * Hub `i` in the returned `nodes` array corresponds to `sections[i]`.
 * When the scroll store activates section `i`, the renderer brightens
 * hub `i` and "charges" the edges attached to it.
 */

import * as THREE from 'three';

export interface ConstellationNode {
  position: THREE.Vector3;
  /** Hub (section) index this node represents, or -1 for satellites. */
  hub: number;
}

export interface ConstellationEdge {
  /** Indices into the combined `nodes` array. */
  a: number;
  b: number;
}

export interface ConstellationLayout {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
}

export interface BuildOptions {
  satelliteCount?: number;
  /** Extra chord edges between non-adjacent hubs for a web-like feel. */
  chords?: boolean;
  seed?: number;
}

/** Deterministic PRNG so the graph is identical across re-renders. */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Smoothstep 0..1 used to shape the traveling edge pulse. */
export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function buildConstellationLayout(
  hubCount: number,
  { satelliteCount = 14, chords = true, seed = 20260806 }: BuildOptions = {},
  aspect = 1.6,
): ConstellationLayout {
  const rand = mulberry32(seed);

  // Ellipse radii sized to roughly fill the view frustum while leaving the
  // center clear. `rx` grows with aspect so wide screens get a wider field.
  const safeAspect = aspect > 0 ? aspect : 1.6;
  const rx = clamp(1.45 * safeAspect * 0.92, 1.55, 3.0);
  const ry = 1.5;

  const nodes: ConstellationNode[] = [];

  // Hubs on the ring — one per section, starting at the top.
  for (let i = 0; i < hubCount; i++) {
    const a = (i / hubCount) * Math.PI * 2 - Math.PI / 2 + rand() * 0.2;
    const jitter = 0.92 + rand() * 0.16;
    nodes.push({
      position: new THREE.Vector3(
        Math.cos(a) * rx * jitter,
        Math.sin(a) * ry * jitter,
        Math.sin(a * 3) * 0.7,
      ),
      hub: i,
    });
  }

  // Satellites on an annulus inside the ring (never in the clear center).
  for (let i = 0; i < satelliteCount; i++) {
    const a = rand() * Math.PI * 2;
    const r = 0.55 + rand() * 0.5;
    nodes.push({
      position: new THREE.Vector3(
        Math.cos(a) * rx * r,
        Math.sin(a) * ry * r,
        (rand() - 0.5) * 1.7,
      ),
      hub: -1,
    });
  }

  const edges: ConstellationEdge[] = [];
  const link = (a: number, b: number) => edges.push({ a, b });

  // Ring through the hubs — guarantees the graph is fully connected.
  for (let i = 0; i < hubCount; i++) {
    link(i, (i + 1) % hubCount);
  }

  // Chord edges for a web-like knowledge-graph feel.
  if (chords) {
    for (let i = 0; i < hubCount; i += 2) {
      link(i, (i + 2) % hubCount);
    }
  }

  // Attach each satellite to its two nearest hubs.
  for (let s = 0; s < satelliteCount; s++) {
    const si = hubCount + s;
    const pos = nodes[si].position;
    const nearest = Array.from({ length: hubCount }, (_, h) => ({
      h,
      d: pos.distanceToSquared(nodes[h].position),
    })).sort((x, y) => x.d - y.d);
    for (let k = 0; k < 2; k++) {
      link(si, nearest[k].h);
    }
  }

  return { nodes, edges };
}
