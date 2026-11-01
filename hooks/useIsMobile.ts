'use client';

import { useEffect, useState } from 'react';
import { MOBILE_BREAKPOINT } from '@/lib/constants';

const check = () => window.innerWidth < MOBILE_BREAKPOINT;

/**
 * Returns true if viewport width is below the mobile breakpoint.
 *
 * Only used by client-only components (the WebGL Scene is `ssr: false`), so
 * the initial state can read `window` directly. That matters: starting at
 * `false` made phones build the desktop pipeline (post-processing, high DPR)
 * for one render before correcting themselves.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : check()
  );

  useEffect(() => {
    const onResize = () => setIsMobile(check());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isMobile;
}
