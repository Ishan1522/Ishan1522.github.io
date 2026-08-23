'use client';

import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

interface Props {
  mobile?: boolean;
}

/**
 * Post-processing — kept restrained. The aurora field is the signature
 * material: its curtain cores sit just under the bloom threshold so the
 * petrol void glows softly (volumetric, not neon). Removed
 * ChromaticAberration — it was causing visible RGB fringing and a flashy,
 * photosensitivity-unfriendly feel.
 */
export function Effects({ mobile = false }: Props) {
  if (mobile) return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={0.45}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.2}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.2} darkness={0.45} />
    </EffectComposer>
  );
}
