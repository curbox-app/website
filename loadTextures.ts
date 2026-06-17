import { Assets, Texture, TextureSource } from 'pixi.js';

/**
 * The single stitched feed strip. The whole ribbon shares ONE texture
 * (`combined.webp` — 720 × 8060 = five vertical reels stacked), so we load
 * exactly that one file rather than the entire `./screenshots_combined/` folder.
 *
 * `?url` gives us the final emitted URL string for the asset; Vite fingerprints
 * it at build time.
 */
export function getReelImageUrls(): string[] {
  const modules = import.meta.glob(
    './screenshots_combined/combined.webp',
    { eager: true, query: '?url', import: 'default' },
  ) as Record<string, string>;

  return Object.values(modules);
}

/**
 * Preload every reel texture through Pixi's Assets system and return them as a
 * plain array (ready to be randomly handed out to the 200 TilingSprites).
 *
 * The source is a 720 × 8060 strip = five vertical screenshots stacked on
 * top of each other. We force `addressMode: 'repeat'` so a TilingSprite can
 * scroll through the strip forever and wrap seamlessly.
 *
 * @param onProgress optional 0..1 callback for a loading UI.
 */
export async function loadReelTextures(
  onProgress?: (progress: number) => void,
): Promise<Texture[]> {
  const urls = getReelImageUrls();

  if (urls.length === 0) {
    throw new Error(
      'Reel strip not found: ./screenshots_combined/combined.webp is missing.',
    );
  }

  // Assets.load accepts an array and returns a { url: Texture } record.
  const loaded = (await Assets.load(urls, onProgress)) as Record<string, Texture>;

  // Map back to the original (sorted) URL order and configure each source for
  // seamless vertical tiling.
  return urls.map((url) => {
    const texture = loaded[url];
    const source = texture.source as TextureSource;

    // Repeat addressing is what makes the "infinite reel" scroll wrap cleanly.
    source.addressMode = 'repeat';
    // Smooth scaling — these strips get drawn at wildly different zoom levels.
    source.scaleMode = 'linear';
    source.autoGenerateMipmaps = true;
    source.update();

    return texture;
  });
}
