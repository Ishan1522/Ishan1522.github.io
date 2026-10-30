/**
 * Projects — the showcase data.
 *
 * To add a new project later:
 *   1. Add an entry to the `projects` array below.
 *   2. Drop images in /public/images/projects/<slug>/
 *   3. The grid picks it up automatically.
 */

export type ProjectStatus = 'production' | 'active' | 'shipped' | 'ongoing' | 'done';
export type Accent = 'cyan' | 'mint';

export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  tech: string[];
  role: string;
  year: string;
  status: ProjectStatus;
  accent: Accent;
  // Drop a hero image at /public/images/projects/<slug>/cover.{jpg,png,webp}
  // and reference it here. Leave `null` to show the gradient placeholder.
  coverImage: string | null;
  links: ProjectLink[];
  /** Rendered as a full-width card above the grid. */
  featured?: boolean;
}

export const projects: Project[] = [
  {
    slug: 'wensura',
    featured: true,
    name: 'Wensura',
    tagline: 'Research platform for battery-materials R&D',
    description:
      'Launched April 2026 and now in beta with about five testers. I led backend, infrastructure, and security: AWS provisioned with Terraform, tenant isolation at the database level, and a multi-stage LLM peer-review pipeline over a RAG corpus. Security testing found and fixed a critical remote-code-execution bug and cross-tenant leaks in retrieval; test coverage went from 27% to 82%.',
    tech: ['Next.js', 'FastAPI', 'AWS', 'Terraform', 'Postgres/pgvector', 'Stripe'],
    role: 'Lead backend & infrastructure',
    year: '2026',
    status: 'production',
    accent: 'cyan',
    coverImage: '/images/projects/wensura/Wensura_logo.gif',
    links: [
      { label: 'Live', href: 'https://wensura.com' },
      // Private repo — omitted intentionally.
    ],
  },
  {
    slug: 'rosfilter',
    name: 'rosfilter',
    tagline: 'ROS 2 filter workbench for robot signal data',
    description:
      'A desktop workbench for designing and testing filters on ROS 2 signal data. Load an MCAP rosbag or subscribe to live topics, inspect time, spectrum, and filter-response views, design biquads (Butterworth, Chebyshev I, RBJ), and export the result as a ready-to-run ROS 2 node in C++ or Rust. It grew out of an FRC-era tool, wpifilter.',
    tech: ['Rust', 'egui', 'ROS 2', 'rclrs', 'MCAP', 'DSP'],
    role: 'Solo',
    year: '2026',
    status: 'active',
    accent: 'mint',
    coverImage: '/images/projects/rosfilter/cover.png',
    links: [
      { label: 'GitHub', href: 'https://github.com/Ishan1522/filters' },
    ],
  },
  {
    slug: 'sar',
    name: 'SAR — Spartan Autonomous Robotics',
    tagline: 'Sim-to-real pipeline, Simulation Lead',
    description:
      'I lead simulation for MSU’s autonomous robotics club. I built a sim-to-real pipeline that runs headless Gazebo and MuJoCo in CI and checks results against real-robot behavior: the mean gap is 4.2 cm against an 8 cm threshold, and all four CI checks pass. I also ported the quadruped gait firmware from Python to Rust.',
    tech: ['Gazebo', 'MuJoCo', 'ROS 2', 'Rust', 'CI/CD'],
    role: 'Simulation Lead',
    year: '2026',
    status: 'active',
    accent: 'cyan',
    coverImage: null,
    links: [
      { label: 'GitHub', href: 'https://github.com/msu-sar-robotics' },
    ],
  },
  {
    slug: 'homelab',
    name: 'Homelab',
    tagline: 'Two-node home server for CI and local AI',
    description:
      'A two-node Proxmox setup running containerized workloads: self-hosted CI runners, GPU-enabled dev environments, and a personal multi-agent AI system. Tailscale handles secure access from other networks, and builds run in an isolated sandbox so they can’t touch the host.',
    tech: ['Proxmox', 'Docker', 'Tailscale', 'GitHub Actions', 'Ollama'],
    role: 'Solo',
    year: '2026',
    status: 'ongoing',
    accent: 'mint',
    coverImage: null,
    links: [],
  },
  {
    slug: 'violin-practice-model',
    name: 'Violin Practice Model',
    tagline: 'Computational model of practice as dual prediction-error minimization',
    description:
      'A Python model of violin practice as two coupled prediction-error loops, auditory expectation and cerebellar motor correction, with dopamine-gated consolidation, sleep effects, and spaced-practice scheduling. Comes with a CLI and a FastAPI web app that plots learning curves and generates practice plans.',
    tech: ['Python', 'NumPy', 'FastAPI', 'Computational Neuroscience', 'Web'],
    role: 'Solo',
    year: '2026',
    status: 'active',
    accent: 'mint',
    coverImage: '/images/projects/violin-practice-model/cover.svg',
    links: [
      { label: 'GitHub', href: 'https://github.com/Ishan1522/Violin-Practice-Model' },
    ],
  },
];
