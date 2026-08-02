/**
 * Projects — the showcase data.
 *
 * To add a new project later:
 *   1. Add an entry to the `projects` array below.
 *   2. Drop images in /public/images/projects/<slug>/
 *   3. The grid picks it up automatically.
 */

export type ProjectStatus = 'production' | 'active' | 'shipped' | 'ongoing';
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
    name: 'wpifilter',
    tagline: 'Rust DSP toolkit for FRC / WPILib',
    description:
      'A MATLAB DSP Toolbox analog written in Rust, for tuning robotics control systems. WPILOG binary parser, biquad and cascade filter designers (Butterworth, Chebyshev I, RBJ cookbook), FFT spectrum viewer, zero-phase filtfilt, a pull-evaluated node-graph pipeline, and a live NetworkTables-4 client for on-robot streaming.',
    tech: ['Rust', 'egui', 'NetworkTables 4', 'WPILib', 'DSP'],
    role: 'Solo',
    year: '2026',
    status: 'active',
    accent: 'mint',
    coverImage: '/images/projects/wpifilter/cover.png',
    links: [
      // Replace with your public repo URL when ready.
      { label: 'GitHub', href: 'https://github.com/Ishan1522' },
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
    status: 'shipped',
    accent: 'cyan',
    coverImage: '/images/projects/solar-racing-ci/cover.png',
    links: [
      { label: 'GitHub', href: 'https://github.com/Ishan1522' },
    ],
  },
];
