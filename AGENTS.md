# AGENTS.md — AI agent cheat sheet

> Read this first. ~200 tokens instead of ~15k scanning the whole repo.

## Identity

Ishan's scroll-driven Three.js portfolio. A single evolving neuron grows
dendrites, fires spikes, and rewires synapses as you scroll.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| UI | React 18 + TypeScript (strict) |
| 3D | React Three Fiber 8 + Drei 9 + @react-three/postprocessing |
| Scroll | GSAP 3 ScrollTrigger + Lenis |
| State | Zustand (read via `getState()` in useFrame — no React re-renders) |
| Style | Tailwind CSS 3, cyberpunk palette (cyan/mint on deep navy) |
| Fonts | IBM Plex Sans/Condensed + JetBrains Mono via next/font |

## Critical architecture: scroll → neuron pipeline

```
Lenis (smooth scroll)
  → GSAP ScrollTrigger (per-section triggers + total-progress)
    → useNeuronStore (Zustand) — section index + target phase values
      → R3F useFrame — damp local refs toward target at 60Hz
        → Shader uniforms / mesh transforms
```

**Key rule**: Inside `useFrame`, always read store with
`useNeuronStore.getState()` — never the React hook. That's how this runs at
60Hz without re-renders.

## Directory quick-map

| Path | What's inside | Edit frequency |
|------|--------------|----------------|
| `app/` | layout, page, globals.css | Rare |
| `components/three/` | R3F: Neuron, Soma, Dendrites, Axon, Synapses, shaders/ | Medium |
| `components/sections/` | Hero, About, Projects, Research, GitHub, Contact | Medium |
| `components/ui/` | Nav, SectionLabel, Cards, ScrollHint | Medium |
| `data/` | Content layer: projects.ts, research.ts, sections.ts, personal.ts | **High** |
| `lib/` | constants.ts, neuron-store.ts, dendrite-builder.ts, cn.ts | Low |
| `hooks/` | useReducedMotion.ts, useIsMobile.ts | Rare |
| `public/` | Static assets, resume.pdf, project images | As needed |

## Conventions

- **TypeScript strict** — `tsc --noEmit` must pass. Avoid `any`.
- **Tailwind-first** — use `cn()` from `lib/cn.ts`; no inline styles.
- **Content in data/, not code** — add projects in `data/projects.ts`, not by
  hardcoding JSX. The component grid picks it up automatically.
- **Accessibility** — `prefers-reduced-motion: reduce` switches to
  `StaticFallback.tsx` (SVG, no WebGL). Always test this path.
- **Mobile** — `<768px`: fewer dendrites, fewer particles, no post-processing.
- **Colors** — palette in `lib/constants.ts` (JS) + `tailwind.config.ts` (CSS).
  Keep them in sync.

## Commands

```bash
npm install          # Node ≥ 18.18
npm run dev          # http://localhost:3000
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # next lint (core-web-vitals)
```

## Extending (quick reference)

- **New project**: append to `data/projects.ts`, drop cover image in
  `public/images/projects/<slug>/`
- **New section**: add to `data/sections.ts`, create section component with
  `<section id="...">`, import in `app/page.tsx`
- **Tune neuron visuals**: `lib/constants.ts` (colors), `lib/dendrite-builder.ts`
  (structure), `data/sections.ts` (scroll choreography — phase values per section)
