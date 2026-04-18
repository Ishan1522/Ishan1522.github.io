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
 *
 * progress lives OUTSIDE Zustand intentionally — it's write-from-scroll,
 * read-in-useFrame only. No React component should ever subscribe to it,
 * so putting it in Zustand would just spam subscribers 60x/sec for nothing.
 */

import { create } from 'zustand';
import { sections, type SectionDef } from '@/data/sections';

// ---------------------------------------------------------------------------
// Transient scroll progress — mutable, zero overhead, not reactive.
// Read in useFrame via: scrollProgress.current
// Write in ScrollTrigger via: scrollProgress.current = self.progress
// ---------------------------------------------------------------------------
export const scrollProgress = { current: 0 };

// ---------------------------------------------------------------------------
// Zustand store — only holds values that actually need reactive subscriptions.
// ---------------------------------------------------------------------------
interface NeuronState {
  /** Index of the currently-active section. */
  section: number;

  /** Target phase values — what the neuron should animate toward. */
  target: SectionDef['phase'];

  /** Setters. Called by ScrollTrigger, not by React. */
  setSection: (index: number) => void;
}

const firstPhase = sections[0].phase;

export const useNeuronStore = create<NeuronState>(() => ({
  section: 0,
  target: { ...firstPhase },

  setSection: (index) => {
    const clamped = Math.max(0, Math.min(sections.length - 1, index));
    useNeuronStore.setState({
      section: clamped,
      target: { ...sections[clamped].phase },
    });
  },
}));