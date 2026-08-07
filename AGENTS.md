# AGENTS.md — AI agent cheat sheet

> Read this first. ~200 tokens instead of ~15k scanning the whole repo.

## Identity

Ishan's scroll-driven Three.js portfolio. A background of flowing curl-noise
particles — a "thought in flow" field — where section-scroll drives flow
speed, turbulence, reveal, tilt, and a cyan→mint color drift.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| UI | React 18 + TypeScript (strict) |
| 3D | React Three Fiber 8 + Drei 9 + @react-three/postprocessing |
| Scroll | GSAP 3 ScrollTrigger + Lenis |
| UI animation | Motion 13 (`motion/react`) — scroll reveals, springs, layoutId, count-ups |
| State | Zustand (read via `getState()` in useFrame — no React re-renders) |
| Style | Tailwind CSS 3, cyberpunk palette (cyan/mint on deep navy) |
| Fonts | IBM Plex Sans/Condensed + JetBrains Mono via next/font |

## Critical architecture: scroll → constellation pipeline

```
Lenis (smooth scroll)
  → GSAP ScrollTrigger (per-section triggers + total-progress)
    → useSectionStore (Zustand) — section index + target phase values
      → R3F useFrame — damp local refs toward target at 60Hz
        → hub instance colors/scales + edge vertex colors (charge pulses)
```

**Key rule**: Inside `useFrame`, always read store with
`useSectionStore.getState()` — never the React hook. That's how this runs at
60Hz without re-renders.

## Directory quick-map

| Path | What's inside | Edit frequency |
|------|--------------|----------------|
| `app/` | layout, page, globals.css | Rare |
| `components/three/` | R3F: Scene, FlowField, Effects, StaticFallback | Medium |
| `components/sections/` | Hero, About, Projects, Research, GitHub, Contact | Medium |
| `components/ui/` | Nav, SectionLabel, Cards, ScrollHint, Reveal | Medium |
| `components/providers/` | SmoothScrollProvider, MotionProvider | Rare |
| `data/` | Content layer: projects.ts, research.ts, sections.ts, personal.ts | **High** |
| `lib/` | constants.ts, section-store.ts, flow-field.ts, flow-field-shaders.ts, cn.ts | Low |
| `hooks/` | useReducedMotion.ts, useIsMobile.ts | Rare |
| `public/` | Static assets, resume.pdf, project images | As needed |

## The flow-field background

- `lib/flow-field.ts` — deterministic particle seeding. Homes form an
  organic cloud: a soft outward density ramp (small inner cutoff so the
  middle stays relatively clear but is never an empty void), per-particle
  y-squish variance, wider z-spread, radial edge jitter, and ~7% dimmed
  inner strays; packed seed vec4 + dimmed palette color per particle.
- `lib/flow-field-shaders.ts` — GLSL. The vertex shader advects each
  particle along a divergence-free 2D curl-noise field (3 octaves,
  incommensurate frequencies → non-repeating), recomputing position as a
  pure function of (home, time) every frame — stateless, zero CPU per frame.
- `components/three/FlowField.tsx` — `<points>` + `shaderMaterial`. Damps
  store phase values into uniforms in `useFrame`: `firingRate` → advection
  speed, `stdpIntensity` → turbulence/wander, `dendriteGrowth` → reveal
  alpha, `spikeActive` → charge boost, section index → cyan→mint accent.
  Also hosts the "un-boring" pass: `uStreak` (round point → velocity
  ribbon), `uSlowColor`/`uFastColor` (speed-color cyan→mint), a
  section-change burst folded into charge/size/reveal via a 0.15s-attack →
  long-exponential-tail envelope (reads as a swell, not a flash), scroll-
  progress rate → capped, slow-damped turbulence churn, and a damped
  `uMouse`/`uMouseRadius`/`uMouseForce` pointer repel (negative force =
  repel, desktop only, kept snappy). The field rig uses a *bounded* Y sway
  (not an unbounded spin — an accumulating spin parks the perspective/
  fog-weighted silhouette on one side and reads as horizontal drift) plus a
  damped scroll tilt clamped to ±0.15.
- `components/three/Effects.tsx` — restrained Bloom + Vignette (desktop only).
- Legibility rule: homes are periphery-biased, near-axis particles are faded
  (center-clearance), depth-fogged with the Scene's FogExp2, and overall
  brightness is kept low so the center content stays readable.

## Motion conventions

- **Import from `motion/react`** — free MIT core only. No Motion+ paid components.
- **Reveal-on-scroll** = `components/ui/Reveal.tsx` (Motion `useInView`). Wrap any
  content you want to fade up; `delay` staggers lists. SSR/no-JS renders visible.
- **Global reduced-motion** — `MotionProvider` (`MotionConfig reducedMotion="user"`)
  disables transforms/layout animations automatically. Components that branch
  hard (Hero) use `useReducedMotion()` directly.
- **Layout morphs** — active nav underline uses `layoutId="nav-underline"`.
- **Count-ups / bars** — GitHub section: `animate()` on a motion value for stat
  numbers, `whileInView` width springs for language bars.
- **Don't mix GSAP and Motion on the same element** — GSAP owns the scroll→bg
  pipeline (Lenis + ScrollTrigger); Motion owns UI-layer animation (reveals,
  hovers, springs). The hero parallax uses Motion `useScroll`, which reads the
  same window scroll Lenis animates.

## Conventions

- **TypeScript strict** — `tsc --noEmit` must pass. Avoid `any`.
- **Tailwind-first** — use `cn()` from `lib/cn.ts`; no inline styles.
- **Content in data/, not code** — add projects in `data/projects.ts`, not by
  hardcoding JSX. The component grid picks it up automatically.
- **Accessibility** — `prefers-reduced-motion: reduce` switches to
  `StaticFallback.tsx` (SVG, no WebGL). Always test this path.
- **Mobile** — `<768px`: fewer particles, no post-processing.
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
- **Tune flow-field visuals**: `lib/constants.ts` (colors), `lib/flow-field.ts`
  (seeding — shell radii, counts), `lib/flow-field-shaders.ts` (curl
  octaves/frequency), `data/sections.ts` (scroll choreography — phase
  values per section)
