# Contributing

Thanks for your interest in contributing to this portfolio! This is a personal
site, but bug reports, fixes, and improvements are welcome.

## Getting started

```bash
git clone https://github.com/Ishan1522/Ishan1522.github.io.git
cd Ishan1522-Ishan1522.github.io
npm install
npm run dev          # http://localhost:3000
```

Node ≥ 18.18 required.

Before making changes, run the type checker:

```bash
npm run typecheck    # strict TS, no emit
npm run lint         # ESLint (next/core-web-vitals)
```

## Proposing changes

1. **Open an issue first** — describe what you want to change and why. This
   avoids wasted effort if the change doesn't fit the project's direction.
2. **Fork the repo** and create a branch from `main`.
3. **Keep changes focused** — one concern per PR.
4. **Write clear commit messages** using conventional commits:
   ```
   feat: add dark mode toggle
   fix: correct dendrite wobble at narrow viewports
   chore: upgrade GSAP to 3.12.6
   ```
5. **Test your changes** — run `npm run typecheck && npm run build` before
   pushing. PRs that fail type checking or break the production build will
   not be merged.
6. **Open a PR** against `main` with a clear description and a link to the
   related issue.

## Code style

- **TypeScript strict** — no `any` without a comment explaining why.
- **Tailwind-first** — avoid inline styles. Use `clsx` + `tailwind-merge` via
  the `cn()` utility in `lib/cn.ts`.
- **Three.js** — keep shader code in `components/three/shaders/` as exported
  GLSL strings. New uniforms must be declared in the consuming component and
  wired into `useFrame`.
- **Zustand** — read scroll/neuron state with `useNeuronStore.getState()` inside
  `useFrame`, not the React subscription hook, to avoid 60 Hz re-renders.
- **Accessibility** — must continue to work with `prefers-reduced-motion:
  reduce`. Test the static SVG fallback (`StaticFallback.tsx`) when adding
  visual effects.

## Project structure

Key directories (see the README for the full layout):

| Directory | Purpose |
|-----------|---------|
| `components/three/` | R3F components and shaders |
| `components/sections/` | Scroll sections (Hero, About, Projects, etc.) |
| `components/ui/` | Shared UI (Nav, Card, etc.) |
| `data/` | Content layer — projects, research, sections config |
| `lib/` | Constants, neuron store, dendrite builder, `cn()` |
| `hooks/` | `useReducedMotion`, `useIsMobile` |

## Need help?

Open an issue with the `question` label, or start a discussion. If you're
unsure about the scroll-driven neuron architecture, read the **Architecture**
section in the README — it explains the Lenis → GSAP → Zustand → useFrame
pipeline in detail.
