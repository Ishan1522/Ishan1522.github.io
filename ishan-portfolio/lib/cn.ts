import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware classname merger. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
