/**
 * Dendritic tree generator.
 * Now with one level of bifurcation — primary branches split into two
 * secondaries at ~65% of their length, dramatically more neuron-like.
 */

import * as THREE from 'three';

export interface DendriteBranch {
  curve: THREE.CatmullRomCurve3;
  tipPosition: THREE.Vector3;
}

export interface DendriteConfig {
  steps?: number;
  wobble?: number;
  lengthMin?: number;
  lengthMax?: number;
  spreadAngle?: number; // radians, how wide secondaries fan out
  seed?: number;
}

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

function buildBranch(
  origin: THREE.Vector3,
  dir: THREE.Vector3,
  length: number,
  steps: number,
  wobble: number,
  spreadAngle: number,
  depth: number,
  rand: () => number,
): DendriteBranch[] {
  const worldUp = new THREE.Vector3(0, 1, 0);
  const ref = Math.abs(dir.dot(worldUp)) > 0.99
    ? new THREE.Vector3(1, 0, 0)
    : worldUp;
  const perp1 = new THREE.Vector3().crossVectors(dir, ref).normalize();
  const perp2 = new THREE.Vector3().crossVectors(dir, perp1).normalize();

  const points: THREE.Vector3[] = [];
  for (let j = 0; j <= steps; j++) {
    const t = j / steps;
    const point = origin.clone().addScaledVector(dir, t * length);
    if (j > 0 && j < steps) {
      point.addScaledVector(perp1, (rand() - 0.5) * wobble);
      point.addScaledVector(perp2, (rand() - 0.5) * wobble);
    }
    points.push(point);
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const results: DendriteBranch[] = [
    { curve, tipPosition: points[points.length - 1].clone() },
  ];

  if (depth > 0) {
    // Split point at ~65% along the branch.
    const splitPoint = curve.getPoint(0.65);
    const childLength = length * 0.6;
    const childWobble = wobble * 0.8;

    // Two children fanning out symmetrically around perp1.
    const child1Dir = dir.clone().applyAxisAngle(perp1, spreadAngle).normalize();
    const child2Dir = dir.clone().applyAxisAngle(perp1, -spreadAngle).normalize();

    results.push(
      ...buildBranch(splitPoint, child1Dir, childLength, steps, childWobble, spreadAngle, depth - 1, rand),
      ...buildBranch(splitPoint, child2Dir, childLength, steps, childWobble, spreadAngle, depth - 1, rand),
    );
  }

  return results;
}

export function buildDendrites(count: number, config: DendriteConfig = {}): DendriteBranch[] {
  const {
    steps = 6,
    wobble = 0.25,
    lengthMin = 2.0,
    lengthMax = 3.2,
    spreadAngle = 0.45,
    seed = 1337,
  } = config;

  const rand = mulberry32(seed);
  const branches: DendriteBranch[] = [];

  // Soma surface origin for each primary branch.
  const somaRadius = 0.45;

  for (let i = 0; i < count; i++) {
    const phi = Math.acos(1 - 2 * ((i + rand() * 0.6) / count));
    const theta = Math.PI * (1 + Math.sqrt(5)) * i + rand() * 0.8;
    const dir = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi)
    ).normalize();

    const origin = dir.clone().multiplyScalar(somaRadius);
    const length = lengthMin + rand() * (lengthMax - lengthMin);

    branches.push(
      ...buildBranch(origin, dir, length, steps, wobble, spreadAngle, 1, rand),
    );
  }

  return branches;
}