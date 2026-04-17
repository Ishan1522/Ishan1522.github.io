/**
 * Global scroll / neuron-state store.
 *
 * Architecture:
 *   GSAP ScrollTrigger writes targets into this store as the user scrolls
 *   (in SmoothScrollProvider). R3F components read these values inside
 *   useFrame() and smoothly damp their own state toward them.
 *
 * Why mutable refs instead of React state?
 *   Because updating 60Hz via setState would re-render the whole tree.
 *   Zustand's transient subscriptions + direct mutation = zero re-renders.
 *
 * Read values via:
 *   const state = useNeuronStore.getState();        // one-shot read in useFrame
 *   const active = useNeuronStore(s => s.section);  // reactive subscription (for UI)
 */

import { create } from 'zustand';
import { sections, type SectionDef } from '@/data/sections';

interface NeuronState {
  /** Index of the currently-active section. */
  section: number;
  /** 0..1 progress through the document. */
  progress: number;

  /** Target phase values — what the neuron should animate toward. */
  target: SectionDef['phase'];

  /** Setters. Called by ScrollTrigger, not by React. */
  setSection: (index: number) => void;
  setProgress: (p: number) => void;
}

const firstPhase = sections[0].phase;

export const useNeuronStore = create<NeuronState>((set) => ({
  section: 0,
  progress: 0,
  target: { ...firstPhase },

  setSection: (index) => {
    const clamped = Math.max(0, Math.min(sections.length - 1, index));
    set({ section: clamped, target: { ...sections[clamped].phase } });
  },
  setProgress: (p) => set({ progress: p }),
}));
