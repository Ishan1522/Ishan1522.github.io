import { create } from 'zustand';
import { sections, type SectionDef } from '@/data/sections';

export const scrollProgress = { current: 0 };

interface NeuronState {
  section: number;
  target: SectionDef['phase'];

  /** Interaction state — written by pointer events, read in useFrame. */
  hovered: boolean;
  apTriggerTime: number; // elapsed seconds when last AP was fired, -1 = never

  setSection: (index: number) => void;
  setHovered: (h: boolean) => void;
  triggerAP: (elapsedTime: number) => void;
}

const firstPhase = sections[0].phase;

export const useNeuronStore = create<NeuronState>(() => ({
  section: 0,
  target: { ...firstPhase },
  hovered: false,
  apTriggerTime: -1,

  setSection: (index) => {
    const clamped = Math.max(0, Math.min(sections.length - 1, index));
    useNeuronStore.setState({
      section: clamped,
      target: { ...sections[clamped].phase },
    });
  },

  setHovered: (h) => useNeuronStore.setState({ hovered: h }),

  triggerAP: (elapsedTime) =>
    useNeuronStore.setState((s) => ({
      apTriggerTime: elapsedTime,
      target: { ...s.target, spikeActive: 1 },
    })),
}));