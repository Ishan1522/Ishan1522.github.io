/**
 * Section registry.
 *
 * The `id` here drives everything:
 *   - Each section component mounts with id={id}
 *   - Nav scrolls to #id
 *   - The scroll store tracks which phase we're in based on section index
 *
 * `phase` is a 0-1 value the background reads to decide what to look like.
 * Add/reorder sections here; the background maps each section's phase to
 * its parameters (firing rate, spike activity, trace shimmer, reveal,
 * tilt, color accent) automatically.
 */

export interface SectionDef {
  id: string;
  label: string;   // Display label for nav
  /** Background's target state when this section is active. */
  phase: {
    dendriteGrowth: number;  // 0..1 global reveal/fade-in of the wave field
    spikeActive: number;     // 0..1 action potentials fire from the active focus (0/1 in practice)
    stdpIntensity: number;   // 0..1 EEG-trace activity / shimmer between sections
    firingRate: number;      // 0..1 wave emission rate + expansion speed
    cameraZ: number;         // Subtle camera push/pull
    rotation: number;        // Sway/tilt of the whole field
  };
}

export const sections: SectionDef[] = [
  {
    id: 'hero',
    label: 'Intro',
    phase: { dendriteGrowth: 0.45, spikeActive: 0, stdpIntensity: 0, firingRate: 0, cameraZ: 5.5, rotation: 0 },
  },
  {
    id: 'about',
    label: 'About',
    phase: { dendriteGrowth: 0.85, spikeActive: 0, stdpIntensity: 0.15, firingRate: 0, cameraZ: 5.0, rotation: 0.12 },
  },
  {
    id: 'projects',
    label: 'Projects',
    phase: { dendriteGrowth: 1.0, spikeActive: 1, stdpIntensity: 0.35, firingRate: 0.25, cameraZ: 4.6, rotation: -0.18 },
  },
  {
    id: 'research',
    label: 'Research',
    phase: { dendriteGrowth: 1.0, spikeActive: 1, stdpIntensity: 0.8, firingRate: 0.4, cameraZ: 4.2, rotation: 0.22 },
  },
  {
    id: 'github',
    label: 'Activity',
    phase: { dendriteGrowth: 1.0, spikeActive: 1, stdpIntensity: 0.6, firingRate: 0.55, cameraZ: 5.0, rotation: -0.1 },
  },
  {
    id: 'contact',
    label: 'Contact',
    phase: { dendriteGrowth: 1.0, spikeActive: 1, stdpIntensity: 0.4, firingRate: 0.7, cameraZ: 5.8, rotation: 0 },
  },
];
