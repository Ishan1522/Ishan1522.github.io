# ishan-portfolio

Personal portfolio site. Built for Ishan, EE @ MSU.

A Next.js single-page site with a Three.js scroll-driven background (aurora gradient layers on a shader plane) and a data-driven content layer for projects and research.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- React Three Fiber 8 + Drei 9 + @react-three/postprocessing
- GSAP 3 + ScrollTrigger (scroll-driven background state)
- Motion 13 (`motion/react`) for UI animations
- Lenis (smooth scrolling)
- Zustand (scroll state)
- Tailwind CSS 3
- IBM Plex Sans / Condensed + JetBrains Mono via `next/font`

All animation libraries are free/MIT.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # strict TS check without emitting
```

Node >= 18.18 required.

## Deploying

Vercel works out of the box: push to GitHub, import the repo, accept the defaults. Other Node/Next.js hosts (Cloudflare Pages, Netlify, Fly.io, self-hosted) also work.

## Architecture

### Scroll-driven background

```
Lenis (smooth scroll)
  -> GSAP ScrollTrigger (per-section triggers + total-progress trigger)
  -> useSectionStore (Zustand: section index + target phase values)
  -> R3F useFrame hooks (damp local refs toward target each frame)
  -> shader uniforms (aurora field animates)
```

The store is read inside `useFrame` via `useSectionStore.getState()` rather than the subscription hook, so the Three.js scene graph updates without React re-renders at 60Hz.

### Directory layout

```
app/
  layout.tsx        fonts, metadata, html shell
  page.tsx          assembles Nav + shell + sections
  globals.css       Tailwind + Lenis styles
components/
  PortfolioShell.tsx    reduced-motion branching, mounts Scene + provider
  providers/
    SmoothScrollProvider.tsx   Lenis + ScrollTrigger wiring
  three/
    Scene.tsx           Canvas, camera rig, fog
    Aurora.tsx          aurora shader plane
    Effects.tsx         Bloom + vignette
    StaticFallback.tsx  SVG-only fallback for reduced motion
  sections/       Hero, About, Projects, Research, GitHub, Contact
  ui/             Nav, SectionLabel, ScrollHint, ProjectCard, ResearchCard, Reveal
data/             personal, projects, research, sections (content layer)
hooks/            useReducedMotion, useIsMobile
lib/              cn, constants, section-store, aurora-shaders
public/
  favicon.svg
  resume.pdf     replace with your actual resume
  images/projects/<slug>/  project cover images
```

## Extending

### Adding a project

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

Drop an image at `public/images/projects/my-project/cover.png`. The grid picks it up automatically. `coverImage` may be `null` to render the gradient placeholder.

### Adding a research track

Same pattern in `data/research.ts`.

### Adding a section

1. Add an entry to `data/sections.ts`; the `phase` object defines the background state when that section is active.
2. Create `components/sections/MySection.tsx`, rendering a `<section id="my-section">`.
3. Import it in `app/page.tsx` in the desired order.

Nav, active-section tracking, and background state update automatically.

### Tuning the aurora

- Color palette: `lib/constants.ts` (`COLORS`) and `tailwind.config.ts`
- Curtains: `lib/aurora-shaders.ts` (band count/height/thickness, drift multipliers, warp strength, edge fade, dither) and `components/three/Aurora.tsx` (brightness envelope, mobile octave count)
- Scroll choreography: `data/sections.ts` (per-section target `phase` values: reveal, drift speed, swell, camera Z, rotation)

## Accessibility

- Respects `prefers-reduced-motion: reduce`; the 3D canvas and Lenis are disabled and replaced with a static SVG fallback. UI animations are gated via `MotionConfig reducedMotion="user"`.
- Focus-visible rings in the brand cyan.
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`.
- External links use `target="_blank"` with `rel="noopener noreferrer"`.

## Performance

- Mobile viewport (<768px): fewer noise octaves (3 vs 4), post-processing disabled.
- Single additive shader plane; no CPU simulation, textures, or per-band geometry. The fragment shader is the main cost.
- Scene lazy-loaded via `next/dynamic` with `ssr: false`, keeping the WebGL bundle out of the initial payload.
- Fonts self-hosted via `next/font`.
- Content layer is static data; no per-section client JS.

## Placeholders

- `public/resume.pdf` — replace with your actual resume
- `public/images/projects/*/` — project screenshots; set `coverImage` in `data/projects.ts`
- GitHub stats section uses third-party SVG services; replace with self-hosted if desired
- Wensura live URL is `https://wensura.com` — update if it changes

## License

Private. All rights reserved.
