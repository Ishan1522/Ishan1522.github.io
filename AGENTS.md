# AGENTS.md — AI agent cheat sheet

> Read this first. ~200 tokens instead of ~15k scanning the whole repo.

## Identity

Ishan's scroll-driven Three.js portfolio. A background of layered aurora
"curtain" gradients — northern-lights-style ribbons of domain-warped noise
painted on a single shader plane — where section-scroll drives a gentle
cyan→mint color drift, drift speed, a reveal envelope, a faint brightness
swell, and a very slow rotational drift. Calm, premium, atmospheric: the
background recedes behind content rather than acting as a subject.

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

## Critical architecture: scroll → background pipeline

```
Lenis (smooth scroll)
  → GSAP ScrollTrigger (per-section triggers + total-progress)
    → useSectionStore (Zustand) — section index + target phase values
      → R3F useFrame — damp local refs toward target at 60Hz
        → shader uniforms (aurora gradient layers, pure GPU — no CPU sim)
```

**Key rule**: Inside `useFrame`, always read store with
`useSectionStore.getState()` — never the React hook. That's how this runs at
60Hz without re-renders.

## Directory quick-map

| Path | What's inside | Edit frequency |
|------|--------------|----------------|
| `app/` | layout, page, globals.css | Rare |
| `components/three/` | R3F: Scene, Aurora, Effects, StaticFallback | Medium |
| `components/sections/` | Hero, About, Projects, Research, GitHub, Contact | Medium |
| `components/ui/` | Nav, SectionLabel, Cards, ScrollHint, Reveal | Medium |
| `components/providers/` | SmoothScrollProvider, MotionProvider | Rare |
| `data/` | Content layer: projects.ts, research.ts, sections.ts, personal.ts | **High** |
| `lib/` | constants.ts, section-store.ts, aurora-shaders.ts, cn.ts | Low |
| `hooks/` | useReducedMotion.ts, useIsMobile.ts | Rare |
| `public/` | Static assets, resume.pdf, project images | As needed |

## The aurora background

- `lib/aurora-shaders.ts` — GLSL. One large camera-facing plane (24×24 units,
  always larger than the frustum at any camera Z) whose fragment shader
  paints 3 layered "curtain" bands of fbm/value noise with **domain
  warping** (iq-style 2-stage warp: `q = fbm(p)`, `r = fbm(p + 3.5q)`), the
  silky folded-ribbon look. The vertex shader passes world XY to the
  fragment; dividing by the live frustum half-extents maps the visible rect
  to NDC, so the field is full-bleed at any camera Z (no empty-center, and
  the edge fade stays glued to the viewport). No particles, no textures, no
  CPU sim — one additive quad with `toneMapped:false` (everything stays well
  below the Bloom threshold; the field is atmosphere, not a subject).
  A 1-bit hash dither kills residual 8-bit banding in the gradients.
- `components/three/Aurora.tsx` — `<mesh>` (plane) + `shaderMaterial`.
  Damps store phase values into uniforms in `useFrame`:
  `section` → `uAccentMix` (cyan→mint drift), `firingRate` → `uFlow` (noise
  drift speed), `dendriteGrowth` → `uGlobalAlpha` reveal envelope,
  `rotation` → `uSpin` (very slow rotational drift), `spikeActive` → `uPulse`
  (faint slow brightness swell — NOT a burst), `stdpIntensity` → `uShimmer`
  (subtle brightness lift). Reads `previewUi` (harness multipliers:
  intensity scales the envelope, speed scales the clock). Reduced motion
  freezes the clock → one coherent static aurora; mobile drops to 3 noise
  octaves and dims the field.

> History: the B4 aurora background replaced the earlier B3 firing-wave /
> EEG-oscilloscope background (`FiringWave.tsx`, `lib/firing-wave.ts`,
> `lib/firing-wave-shaders.ts` — deleted). B3 was a CPU-side ring-buffer
> wave sim packed per-frame into a DataTexture and painted by a fixed 2×2
> plane; B4 removes the CPU sim entirely and fixes full-bleed robustness
> (the B3 quad only covered part of the frustum at dollied-out cameras).
> Before B3, the background was the B2 curl-noise flow-field
> (`FlowField.tsx`, `lib/flow-field.ts`, `lib/flow-field-shaders.ts` —
> deleted), a stateless particle field advected along divergence-free curl
> noise. The CameraRig dolly softening and general Scene shell survived
> across all generations.
- `components/three/Effects.tsx` — restrained Bloom + Vignette (desktop only).
- Legibility rule: curtains are dim (band multipliers 0.11–0.17 on top of a
  deep-indigo base), the full-field haze keeps every region above zero (no
  dead zones anywhere), and overall brightness stays well below the content
  layer — peak ~0.3 luma, under the Bloom threshold, vignette-consistent.

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
- **Mobile** — `<768px`: fewer live waves, no post-processing.
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
- **Tune aurora visuals**: `lib/constants.ts` (colors),
  `lib/aurora-shaders.ts` (band counts/heights/thickness, drift multipliers,
  warp strength, edge fade, dither — the aesthetic knobs are all in the
  shader), `components/three/Aurora.tsx` (brightness envelope, mobile octave
  count), `data/sections.ts` (scroll choreography — phase values per
  section)
