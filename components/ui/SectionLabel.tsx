import { cn } from '@/lib/cn';

interface Props {
  index: string;
  label: string;
  className?: string;
}

/**
 * Section header label. Inspired by scientific-paper figure labels:
 *   [01]  —  About
 * The index uses a monospace and is visually quieter than the label.
 */
export function SectionLabel({ index, label, className }: Props) {
  return (
    <div className={cn('flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em]', className)}>
      <span className="text-slate-muted">[{index}]</span>
      <span className="h-px flex-1 max-w-10 bg-cyan/40" />
      <span className="text-cyan">{label}</span>
    </div>
  );
}
