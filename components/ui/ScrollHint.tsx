/** Quiet "scroll" cue on the hero. Static — the aurora is the animation. */
export function ScrollHint() {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-muted">
      <span className="h-px w-8 bg-slate-muted/60" />
      Scroll
    </div>
  );
}
