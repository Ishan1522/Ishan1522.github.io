import type { Metadata } from 'next';

import { BgPreview } from '@/components/bg-preview/BgPreview';

/**
 * Dev-only background preview harness (/bg-preview).
 *
 * Renders the background full-bleed with no content overlay so the art can
 * be judged on its own. Statically exported like every other route — the
 * WebGL Scene is lazy-mounted client-side inside BgPreview (ssr: false),
 * the same pattern PortfolioShell uses. Deliberately NOT linked from the
 * nav or sitemap: this is a QA tool, not part of the user flow.
 */
export const metadata: Metadata = {
  title: 'Background Preview — QA Harness',
  robots: { index: false, follow: false },
};

export default function BgPreviewPage() {
  return <BgPreview />;
}
