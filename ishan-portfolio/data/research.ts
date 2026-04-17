/**
 * Research interests — three sustained independent tracks.
 * Add a new track by appending to the array.
 */

export interface ResearchTrack {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  keywords: string[];
  stage: string; // e.g. "Self-study", "Early research", "Active"
  accent: 'cyan' | 'mint';
}

export const research: ResearchTrack[] = [
  {
    slug: 'compneuro',
    title: 'Computational Neuroscience',
    subtitle: 'Code-first, from LIF to large-scale dynamics',
    description:
      'Building models from the ground up: integrate-and-fire and Hodgkin–Huxley neurons, Hebbian / STDP plasticity, Hopfield networks, Wilson–Cowan E/I dynamics, and working toward dynamical systems, chaos, epilepsy, and basal-ganglia TD learning. Every concept is a running simulation before I call it understood.',
    keywords: ['LIF / HH', 'STDP', 'Dynamical systems', 'E/I balance', 'Brain oscillations'],
    stage: 'Active',
    accent: 'cyan',
  },
  {
    slug: 'green-ai',
    title: 'Green AI',
    subtitle: 'Efficient ML, inference cost, Jevons',
    description:
      'Efficient machine learning: model compression, quantization, inference-vs-training cost, energy and water usage, the Jevons paradox in compute, regional energy variation, and edge deployment. Working toward a first publishable paper on a focused angle within this space.',
    keywords: ['Model compression', 'Inference cost', 'CodeCarbon', 'Edge ML'],
    stage: 'Self-study → research',
    accent: 'mint',
  },
  {
    slug: 'holography',
    title: 'Holographic Displays',
    subtitle: 'Plasma, metasurfaces, light fields',
    description:
      'A layered curriculum from foundational math through fabrication: laser-plasma displays, metasurfaces, light field theory, acoustic levitation, and nanophotonics. ~25 papers deep, building toward the frontier.',
    keywords: ['Metasurfaces', 'Light fields', 'Nanophotonics', 'Plasma displays'],
    stage: 'Self-study',
    accent: 'cyan',
  },
];
