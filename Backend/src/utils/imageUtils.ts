import sharp from 'sharp';

export type ProcessOptions = {
  width?: number;
  quality?: number;
};

export async function toWebp(buffer: Buffer, opts: ProcessOptions = {}) {
  const { width, quality = 80 } = opts;

  let transformer = sharp(buffer).webp({ quality });
  if (width) transformer = transformer.resize({ width, withoutEnlargement: true });

  const out = await transformer.toBuffer();
  return { buffer: out, contentType: 'image/webp' };
}

export async function generateResponsiveImages(buffer: Buffer) {
  const sizes = [400, 800, 1200];
  const results: { keySuffix: string; buffer: Buffer; contentType: string }[] = [];

  for (const size of sizes) {
    const { buffer: b, contentType } = await toWebp(buffer, { width: size, quality: 80 });
    results.push({ keySuffix: `-${size}w.webp`, buffer: b, contentType });
  }

  return results;
}

export default { toWebp, generateResponsiveImages };
