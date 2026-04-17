'use client';

import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

interface Props {
  mobile?: boolean;
}

/**
 * Post-processing — kept intentionally restrained per the "muted cyberpunk"
 * brief. Only the spike and synapse highlights cross the bloom threshold;
 * the soma glow is kept below it so the overall image stays calm.
 *
 * Removed ChromaticAberration — it was causing visible RGB fringing and
 * contributing to a flashy, photosensitivity-unfriendly feel.
 */
export function Effects({ mobile = false }: Props) {
  if (mobile) return null;
  return (
    <EffectComposer multisampling={0} disableNormalPass>
      <Bloom
        intensity={0.35}
        luminanceThreshold={0.75}
        luminanceSmoothing={0.2}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.2} darkness={0.45} />
    </EffectComposer>
  );
}
