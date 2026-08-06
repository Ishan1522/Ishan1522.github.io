# ishan-portfolio

A scroll-driven Three.js portfolio. The centerpiece is a single evolving neuron
that grows its dendrites, fires spikes down an axon, and rewires its synapses
as you scroll through the site.

Built for Ishan — EE @ MSU.

## Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **React Three Fiber 8** + **Drei 9** + **@react-three/postprocessing**
- **GSAP 3** + **ScrollTrigger** for the scroll-driven neuron state
- **Motion 13** (`motion/react`) for UI-layer animation — scroll reveals,
  spring hovers, `layoutId` nav morph, GitHub stat count-ups and bars
- **Lenis** for smooth inertial scrolling
- **Zustand** for 60Hz-safe scroll state (no re-renders)
- **Tailwind CSS 3** with a custom cyberpunk palette
- **IBM Plex Sans / Condensed** + **JetBrains Mono** via `next/font`

All animation libraries are free/MIT — no paid Motion+ components are used.

## Quick start

```bash
npm install        # or pnpm install / yarn
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # strict TS check without emitting
```

Node ≥ 18.18 required.

## Deploying

Vercel works out of the box — push to GitHub, import the repo, accept defaults,
done. Any host that supports Node/Next.js (Cloudflare Pages, Netlify, Fly.io,
self-hosted) will also work.

## Architecture

### Scroll-driven neuron state flow

```
   user scrolls
        │
        ▼
   Lenis (smooth-scrolls the document)
        │
        ▼
   GSAP ScrollTrigger (per-section triggers + total-progress trigger)
        │
        ▼
   useNeuronStore (Zustand)          ← section index + target phase values
        │
        ▼
   R3F useFrame hooks                ← damp local refs toward target each frame
        │
        ▼
   Shader uniforms / mesh transforms ← the neuron animates
```

Crucially, the store is read inside `useFrame` via `useNeuronStore.getState()`
(not the subscription hook). That means zero React re-renders at 60Hz — only
the Three.js scene graph updates.

### Directory layout

```
app/
  layout.tsx        ← fonts, metadata, html shell
  page.tsx          ← assembles Nav + shell + sections
  globals.css       ← Tailwind + Lenis styles
components/
  PortfolioShell.tsx    ← reduced-motion branching, mounts Scene + provider
  providers/
    SmoothScrollProvider.tsx  ← Lenis + ScrollTrigger wiring
  three/
    Scene.tsx           ← Canvas, camera rig, lights
    Neuron.tsx          ← composes soma/dendrites/axon/synapses
    Soma.tsx            ← cell body + Fresnel shader
    Dendrites.tsx       ← tube geometry per branch + growth shader
    Axon.tsx            ← axon tube + moving spike
    Synapses.tsx        ← InstancedMesh at dendrite tips
    AmbientParticles.tsx
    Effects.tsx         ← Bloom, chromatic aberration, vignette
    StaticFallback.tsx  ← SVG-only fallback for reduced motion
    shaders/            ← GLSL as exported TS strings
  sections/       ← Hero, About, Projects, Research, GitHub, Contact
  ui/             ← Nav, SectionLabel, ScrollHint, ProjectCard, ResearchCard, Reveal
  providers/      ← SmoothScrollProvider, MotionProvider
data/             ← personal, projects, research, sections (content layer)
hooks/            ← useReducedMotion, useIsMobile
lib/              ← cn, constants, neuron-store, dendrite-builder
public/
  favicon.svg
  resume.pdf     ← REPLACE with your actual resume
  images/projects/<slug>/  ← drop cover images here
```

## Extending

### Adding a new project

Open `data/projects.ts` and append to the `projects` array:

```ts
{
  slug: 'my-project',
  name: 'My Project',
  tagline: 'One-line pitch',
  description: 'Longer description...',
  tech: ['Rust', 'WebGPU'],
  role: 'Solo',
  year: '2026',
  status: 'active',
  accent: 'mint',   // or 'cyan'
  coverImage: '/images/projects/my-project/cover.png',
  links: [{ label: 'GitHub', href: 'https://github.com/Ishan1522/my-project' }],
}
```

Then drop an image at `public/images/projects/my-project/cover.png`. The grid
picks it up automatically.

### Adding a research track

Same idea in `data/research.ts`.

### Adding a new section

1. Add an entry to `data/sections.ts` — the `phase` object defines what the
   neuron should look like when that section is active.
2. Create `components/sections/MySection.tsx`, making sure it renders a
   `<section id="my-section">`.
3. Import it in `app/page.tsx` and place it in the order you want.

The nav, active-section tracking, and neuron state all rebalance automatically
around the new entry.

### Tuning the neuron

Most aesthetic knobs live in three places:

- **Color palette** → `lib/constants.ts` (`COLORS`) and `tailwind.config.ts`
- **Neuron structure** → `lib/dendrite-builder.ts` (dendrite count, length,
  wobble) and `components/three/Axon.tsx` (axon curve control points)
- **Scroll choreography** → `data/sections.ts` — each section declares its
  target `phase` values (dendrite growth, spike activity, STDP intensity,
  firing rate, camera Z, rotation)

## Accessibility

- Fully respects `prefers-reduced-motion: reduce` — the 3D canvas and Lenis
  smooth scroll are both disabled, replaced by a calm static SVG fallback.
  Motion UI animations are globally gated via `MotionConfig reducedMotion="user"`.
- Focus-visible rings in the brand cyan.
- Semantic HTML — `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`.
- All external links use `target="_blank"` with `rel="noopener noreferrer"`.

## Performance

- Mobile viewport (<768px): fewer dendrites, fewer particles, post-processing
  disabled. The neuron still morphs — it's just cheaper.
- Lazy-loaded Scene via `next/dynamic` with `ssr: false` so the WebGL bundle
  isn't in the initial payload.
- Fonts self-hosted via `next/font`.
- Content layer is pure data, no client JS per section.

## What's still placeholder

- `public/resume.pdf` — replace with your actual resume
- `public/images/projects/*/` — drop your project screenshots here, then set
  `coverImage` in `data/projects.ts`
- GitHub stats section uses third-party SVG services; swap for self-hosted if
  you want tighter control
- Wensura live URL is currently `https://wensura.com` — update if different

## License

Private. All rights reserved.
