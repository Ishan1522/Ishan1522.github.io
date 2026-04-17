'use client';

import { useEffect, useState } from 'react';
import { MOBILE_BREAKPOINT } from '@/lib/constants';

/**
 * Returns true if viewport width is below the mobile breakpoint.
 * Used to drop particle count and disable post-processing on phones.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}
