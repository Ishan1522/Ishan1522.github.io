import { cn } from '@/lib/cn';

interface Props {
  label: string;
  className?: string;
}

/** Small section eyebrow above each heading. */
export function SectionLabel({ label, className }: Props) {
  return <div className={cn('text-sm font-medium text-cyan', className)}>{label}</div>;
}
