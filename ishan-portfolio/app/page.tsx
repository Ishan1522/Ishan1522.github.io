import { PortfolioShell } from '@/components/PortfolioShell';
import { Nav } from '@/components/ui/Nav';

import { Hero } from '@/components/sections/Hero';
import { About } from '@/components/sections/About';
import { Projects } from '@/components/sections/Projects';
import { Research } from '@/components/sections/Research';
import { GitHub } from '@/components/sections/GitHub';
import { Contact } from '@/components/sections/Contact';

/**
 * Root page.
 *
 * Structure:
 *   <Nav />              ← fixed top nav
 *   <PortfolioShell>     ← fixed backdrop (static or Scene) + smooth scroll
 *     <Hero />           ← scrollable sections, rendered over the backdrop
 *     <About />
 *     <Projects />
 *     <Research />
 *     <GitHub />
 *     <Contact />
 *   </PortfolioShell>
 */
export default function Page() {
  return (
    <>
      <Nav />
      <PortfolioShell>
        <Hero />
        <About />
        <Projects />
        <Research />
        <GitHub />
        <Contact />
      </PortfolioShell>
    </>
  );
}
