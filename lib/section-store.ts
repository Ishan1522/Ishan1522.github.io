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

/**
 * Preview-harness UI multipliers (defaults to 1 = normal page behavior).
 *
 * `ui.intensity` / `ui.speed` are the *target* values set by the /bg-preview
 * harness (keyboard or URL params). Scene's `UiRig` damps them into the
 * shared `previewUi` object below at 60Hz; background subjects read the
 * damped values so the multiplier works for any future background, not just
 * the current one.
 */
export interface UiMultipliers {
  /** Global brightness/size multiplier (0.1–4, 1 = normal). */
  intensity: number;
  /** Global motion-speed multiplier (0.1–4, 1 = normal). */
  speed: number;
}

/** Damped *effective* UI multipliers — written by Scene's `UiRig` in useFrame. */
export const previewUi: UiMultipliers = { intensity: 1, speed: 1 };

interface SectionState {
  /** Index of the section currently in the viewport center. */
  section: number;
  /** Target background phase for the active section. */
  target: SectionDef['phase'];
  /** Preview-harness UI multiplier targets. */
  ui: UiMultipliers;

  setSection: (index: number) => void;
  setUi: (ui: Partial<UiMultipliers>) => void;
}

const firstPhase = sections[0].phase;

export const useSectionStore = create<SectionState>(() => ({
  section: 0,
  target: { ...firstPhase },
  ui: { intensity: 1, speed: 1 },

  setSection: (index) => {
    const clamped = Math.max(0, Math.min(sections.length - 1, index));
    useSectionStore.setState({
      section: clamped,
      target: { ...sections[clamped].phase },
    });
  },

  setUi: (ui) => {
    useSectionStore.setState({ ui: { ...useSectionStore.getState().ui, ...ui } });
  },
}));
