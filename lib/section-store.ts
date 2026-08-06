import { create } from 'zustand';
import { sections, type SectionDef } from '@/data/sections';

/**
 * Scroll → background pipeline state.
 *
 * SmoothScrollProvider flips `section` (and the matching `phase` target)
 * when the user scrolls a section into view. The WebGL background reads
 * these via `useSectionStore.getState()` inside `useFrame` — never the
 * React hook — so the canvas updates at 60Hz without re-rendering.
 */
export const scrollProgress = { current: 0 };

interface SectionState {
  /** Index of the section currently in the viewport center. */
  section: number;
  /** Target background phase for the active section. */
  target: SectionDef['phase'];

  setSection: (index: number) => void;
}

const firstPhase = sections[0].phase;

export const useSectionStore = create<SectionState>(() => ({
  section: 0,
  target: { ...firstPhase },

  setSection: (index) => {
    const clamped = Math.max(0, Math.min(sections.length - 1, index));
    useSectionStore.setState({
      section: clamped,
      target: { ...sections[clamped].phase },
    });
  },
}));
