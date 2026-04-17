/**
 * Section registry.
 *
 * The `id` here drives everything:
 *   - Each section component mounts with id={id}
 *   - Nav scrolls to #id
 *   - The neuron's scroll store tracks which phase we're in based on section index
 *
 * `phase` is a 0-1 value the neuron reads to decide what to look like.
 * Add/reorder sections here; the neuron rebalances automatically.
 */

export interface SectionDef {
  id: string;
  label: string;   // Display label for nav
  index: string;   // Monospace index shown on section header (e.g. "01")
  /** Neuron's target state when this section is active. */
  phase: {
    dendriteGrowth: number;  // 0..1 how grown the dendritic tree is
    spikeActive: number;     // 0..1 whether a spike is propagating
    stdpIntensity: number;   // 0..1 how much synapses are rewiring
    firingRate: number;      // Hz-like multiplier for the repeating spike rhythm
    cameraZ: number;         // Subtle camera push/pull
    rotation: number;        // Tilt of the whole neuron group
  };
}

export const sections: SectionDef[] = [
  {
    id: 'hero',
    label: 'Intro',
    index: '00',
    phase: { dendriteGrowth: 0.45, spikeActive: 0, stdpIntensity: 0, firingRate: 0, cameraZ: 5.5, rotation: 0 },
  },
  {
    id: 'about',
    label: 'About',
    index: '01',
    phase: { dendriteGrowth: 0.85, spikeActive: 0, stdpIntensity: 0.15, firingRate: 0, cameraZ: 5.0, rotation: 0.12 },
  },
  {
    id: 'projects',
    label: 'Projects',
    index: '02',
    phase: { dendriteGrowth: 1.0, spikeActive: 1, stdpIntensity: 0.35, firingRate: 0.25, cameraZ: 4.6, rotation: -0.18 },
  },
  {
    id: 'research',
    label: 'Research',
    index: '03',
    phase: { dendriteGrowth: 1.0, spikeActive: 1, stdpIntensity: 0.8, firingRate: 0.4, cameraZ: 4.2, rotation: 0.22 },
  },
  {
    id: 'github',
    label: 'Activity',
    index: '04',
    phase: { dendriteGrowth: 1.0, spikeActive: 1, stdpIntensity: 0.6, firingRate: 0.55, cameraZ: 5.0, rotation: -0.1 },
  },
  {
    id: 'contact',
    label: 'Contact',
    index: '05',
    phase: { dendriteGrowth: 1.0, spikeActive: 1, stdpIntensity: 0.4, firingRate: 0.7, cameraZ: 5.8, rotation: 0 },
  },
];
