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
}

export const projects: Project[] = [
  {
    slug: 'wensura',
    name: 'Wensura',
    tagline: 'B2B vertical SaaS for battery materials R&D',
    description:
      'Co-built and shipped a production platform serving the battery materials research industry. Full AWS stack (ECS Fargate, CloudFront, RDS with pgvector, ElastiCache, S3, WAF), Stripe subscription flow, Firebase auth, Sentry observability, and a multi-stage LLM peer-review pipeline over a RAG corpus. Launched April 2026.',
    tech: ['Next.js', 'FastAPI', 'Python', 'AWS', 'Terraform', 'Postgres/pgvector', 'Redis', 'Stripe'],
    role: 'Co-founder / Full-stack',
    year: '2026',
    status: 'production',
    accent: 'cyan',
    coverImage: '/images/projects/wensura/Wensura_logo.gif', // e.g. '/images/projects/wensura/cover.png'
    links: [
      { label: 'Live', href: 'https://wensura.com' },
      // Private repo — omitted intentionally.
    ],
  },
  {
    slug: 'wpifilter',
    name: 'rosfilter',
    tagline: 'ROS 2 filter workbench for robot signal data',
    description:
      'A desktop filter design + analysis workbench for ROS 2 signal data — built for both simulation (Gazebo rosbags) and real robots (live topics). Load an MCAP rosbag recording, inspect time-domain / spectrum / filter-response views, design biquad filters (Butterworth, Chebyshev I, RBJ cookbook), wire a node-graph pipeline, and export the filter as a ready-to-run ROS 2 node (rclcpp C++ or rclrs Rust). Live mode subscribes to real topics via rclrs with dynamic message introspection. Evolved from the FRC-era wpifilter (WPILib / NetworkTables); full ROS 2 migration landed 2026.',
    tech: ['Rust', 'egui', 'ROS 2', 'rclrs', 'MCAP', 'DSP'],
    role: 'Solo',
    year: '2026',
    status: 'active',
    accent: 'mint',
    coverImage: '/images/projects/wpifilter/cover.png',
    links: [
      { label: 'GitHub', href: 'https://github.com/Ishan1522/filters' },
    ],
  },
  {
    slug: 'sar-sim2real',
    name: 'SAR — Spartan Autonomous Robotics',
    tagline: 'Sim-to-real pipeline, Simulation Lead',
    description:
      'MSU robotics club — Simulation Lead. Built out the sar-sim2real pipeline: headless Gazebo + MuJoCo CI with a JSONL→MCAP trial-output converter, vendored spot_pico (Phase 1), a full gait port, and a 3-tier video strategy for CI artifacts. Landed 4/4 CI green with a mean sim-to-real reality gap of 0.0418 m — under the 0.08 m threshold.',
    tech: ['Gazebo', 'MuJoCo', 'ROS 2', 'Rust', 'CI/CD'],
    role: 'Simulation Lead',
    year: '2026',
    status: 'active',
    accent: 'cyan',
    coverImage: null,
    links: [
      { label: 'GitHub', href: 'https://github.com/msu-sar-robotics/sar-sim2real' },
    ],
  },
  {
    slug: 'solar-racing-ci',
    name: 'Lysander Dashboard CI',
    tagline: 'Headless LVGL rendering in GitHub Actions',
    description:
      'CI/CD pipeline for MSU Solar Racing that headlessly renders the Lysander dashboard UI inside GitHub Actions using Xvfb + SDL, captures screenshots and animated GIFs as artifacts, and runs a regression check that fails the build on blank frames. Heavy debugging around SDL backend selection, lv_conf.defaults patching, and xdotool-driven interaction.',
    tech: ['LVGL', 'C/C++', 'SDL', 'GitHub Actions', 'Xvfb', 'Bash'],
    role: 'Electrical subteam',
    year: '2026',
    status: 'done',
    accent: 'cyan',
    coverImage: '/images/projects/solar-racing-ci/cover.png',
    links: [
      { label: 'GitHub', href: 'https://github.com/Ishan1522' },
    ],
  },
  {
    slug: 'violin-practice-model',
    name: 'Violin Practice Model',
    tagline: 'Computational model of practice as dual prediction-error minimization',
    description:
      'A Python + NumPy model of violin practice as two coupled prediction-error loops — auditory-cortex expectations and cerebellar motor correction — with dopamine (RPE) gated consolidation, sleep/wake route separation (Walker 2002, Cohen 2005), expanding spacing (Cepeda 2006), OPERA condition checks (Patel 2011), and violin-specific biomechanical load monitoring with an EMG-biofeedback adapter. Ships a CLI and a FastAPI web studio with SVG learning-curve charts, practice-plan generation, and an OPERA / load dashboard.',
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
