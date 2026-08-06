'use client';

import type { ReactNode } from 'react';

import { MotionConfig } from 'motion/react';

interface Props {
  children: ReactNode;
}

/**
 * Global Motion configuration.
 *
 * `reducedMotion="user"` makes every Motion animation in the tree respect
 * `prefers-reduced-motion: reduce` automatically — transforms and layout
 * animations are disabled, opacity fades are kept. This is the free Motion
 * core's built-in accessibility switch, on top of the site's own
 * `useReducedMotion` gates and the CSS media-query flatten in globals.css.
 */
export function MotionProvider({ children }: Props) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
