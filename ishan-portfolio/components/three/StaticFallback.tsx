/**
 * Static fallback for `prefers-reduced-motion`.
 *
 * No animation, no WebGL. A calm gradient + subtle grid. The neuron is
 * suggested rather than shown — a faint radial glow + a single static
 * constellation of dots. Accessible and fast.
 *
 * Note: coordinates are pre-computed and rounded. Math.cos/sin produce
 * results that differ by ~1 ULP between Node (server render) and V8
 * (client), which triggers React hydration warnings. Rounding to 4
 * decimal places normalizes this without any visible change.
 */

// Pre-compute dendrite endpoints at 4-decimal precision.
const DENDRITES = Array.from({ length: 12 }).map((_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const round = (n: number) => Number(n.toFixed(4));
  return {
    x1: round(Math.cos(angle) * 1),
    y1: round(Math.sin(angle) * 1),
    x2: round(Math.cos(angle) * 7),
    y2: round(Math.sin(angle) * 7),
  };
});

export function StaticFallback() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 bg-ink-900"
    >
      {/* Faint grid */}
      <div className="absolute inset-0 bg-grid-faint bg-[size:64px_64px] opacity-50" />
      {/* Central glow */}
      <div className="absolute inset-0 bg-radial-glow" />
      {/* Static "neuron" — a hint of the dynamic one */}
      <svg
        viewBox="-10 -10 20 20"
        className="absolute left-1/2 top-1/2 h-[min(80vh,80vw)] w-[min(80vh,80vw)] -translate-x-1/2 -translate-y-1/2 opacity-60"
      >
        <defs>
          <radialGradient id="soma" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="0" cy="0" r="3" fill="url(#soma)" />
        {DENDRITES.map((d, i) => (
          <g key={i}>
            <line
              x1={d.x1}
              y1={d.y1}
              x2={d.x2}
              y2={d.y2}
              stroke="#22d3ee"
              strokeWidth="0.05"
              opacity="0.5"
            />
            <circle cx={d.x2} cy={d.y2} r="0.12" fill="#34d399" opacity="0.8" />
          </g>
        ))}
      </svg>
    </div>
  );
}
