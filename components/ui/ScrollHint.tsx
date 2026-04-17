/**
 * ScrollHint — the little "scroll" indicator on the hero.
 * CSS-only animation, no JS listeners. Disappears after first scroll via
 * parent's data-scrolled attribute (wired in Hero).
 */
export function ScrollHint() {
  return (
    <div className="flex flex-col items-center gap-3 opacity-70">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-soft">
        Scroll
      </span>
      <div className="relative h-10 w-[1.5px] overflow-hidden bg-white/10">
        <span className="absolute inset-x-0 top-0 h-3 animate-scan bg-gradient-to-b from-transparent via-cyan to-transparent" />
      </div>
    </div>
  );
}
