import fsPromise from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

/*
 * Trip covers render as a ~390x220 CSS px background at up to 3x DPR, so 2000px
 * on the long edge leaves plenty of headroom. Bounding both dimensions rather
 * than just width keeps portrait uploads in the same ballpark as landscape ones.
 */
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 80;

export class UnprocessableImageError extends Error {
  constructor() {
    super('Uploaded file could not be read as an image');
    this.name = 'UnprocessableImageError';
  }
}

/**
 * Rewrites an uploaded file in place as a bounded, correctly oriented JPEG.
 * Returns the new file name, which may differ from the original by extension.
 */
export async function normaliseUploadedImage(dir: string, fileName: string): Promise<string> {
  const sourcePath = path.join(dir, fileName);
  const outputFileName = `${path.basename(fileName, path.extname(fileName))}.jpg`;
  const outputPath = path.join(dir, outputFileName);

  let output: Buffer;

  try {
    output = await sharp(sourcePath)
      /*
       * Bakes EXIF orientation into the pixels. sharp drops metadata on output,
       * so without this a portrait photo tagged orientation=6 would keep its
       * landscape pixel layout and render on its side.
       */
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
  } catch {
    await fsPromise.rm(sourcePath, { force: true });
    throw new UnprocessableImageError();
  }

  await fsPromise.writeFile(outputPath, output);

  if (outputPath !== sourcePath) {
    await fsPromise.rm(sourcePath, { force: true });
  }

  return outputFileName;
}
