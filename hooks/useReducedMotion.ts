'use client';

import { useEffect, useState } from 'react';

/**
 * Respects `prefers-reduced-motion`. When true, skip the 3D canvas and
 * smooth-scroll, show a static hero instead.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return reduced;
}
