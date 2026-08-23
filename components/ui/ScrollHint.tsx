/**
 * ScrollHint — the little "scroll" indicator on the hero.
 * A miniature EEG spike-wave trace in the site's phosphor colors, standing in
 * for the generic gradient scan bar. Static on purpose: the wave-field behind
 * the hero is already the animation.
 */
export function ScrollHint() {
  return (
    <div className="flex flex-col items-center gap-3 opacity-70">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-soft">
        Scroll
      </span>
      <svg className="h-8 w-12" viewBox="0 0 48 32" fill="none" aria-hidden>
        <path
          d="M0 16h9l2-7 4 15 4-19 4 14 2-3h23"
          stroke="rgb(var(--color-cyan) / 0.45)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
