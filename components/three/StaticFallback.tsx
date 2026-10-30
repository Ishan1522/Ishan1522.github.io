/**
 * Static backdrop — shown for the instant before the WebGL aurora mounts, and
 * permanently for `prefers-reduced-motion`.
 *
 * No animation, no WebGL, no SVG: a navy base with a few soft blue / indigo
 * washes positioned roughly where the aurora's ribbons sit, so the handoff to
 * the live shader is a gentle fade-in of detail rather than a change of scene.
 */
export function StaticFallback() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-ink-900"
    >
      <div className="absolute -left-[10%] top-[8%] h-[55%] w-[75%] rounded-full bg-cyan/[0.07] blur-[120px]" />
      <div className="absolute -right-[10%] top-[25%] h-[50%] w-[65%] rounded-full bg-mint/[0.08] blur-[130px]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-950/80 to-transparent" />
    </div>
  );
}
