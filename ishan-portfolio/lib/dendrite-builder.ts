/**
 * Dendritic tree generator.
 *
 * Separated from the Dendrites component so Synapses can reference the exact
 * tip positions without duplicating (and potentially desyncing) the logic.
 */

import * as THREE from 'three';

export interface DendriteBranch {
  curve: THREE.CatmullRomCurve3;
  tipPosition: THREE.Vector3;
}

/** Seeded PRNG so geometry is stable across renders. */
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

export function buildDendrites(count: number, seed = 1337): DendriteBranch[] {
  const branches: DendriteBranch[] = [];
  const rand = mulberry32(seed);

  for (let i = 0; i < count; i++) {
    const phi = Math.acos(1 - 2 * ((i + rand() * 0.6) / count));
    const theta = Math.PI * (1 + Math.sqrt(5)) * i + rand() * 0.8;
    const dir = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi)
    ).normalize();

    const length = 2.0 + rand() * 1.2;

    const steps = 6;
    const points: THREE.Vector3[] = [];
    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      // Start at soma surface (radius 0.45), extend outward by `length`.
      const point = dir.clone().multiplyScalar(t * length + 0.45);
      if (j > 0 && j < steps) {
        const wobble = 0.25;
        point.x += (rand() - 0.5) * wobble;
        point.y += (rand() - 0.5) * wobble;
        point.z += (rand() - 0.5) * wobble;
      }
      points.push(point);
    }

    const curve = new THREE.CatmullRomCurve3(points);
    branches.push({ curve, tipPosition: points[points.length - 1].clone() });
  }
  return branches;
}
