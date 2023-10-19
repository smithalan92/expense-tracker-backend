import { MultipartFile } from '@fastify/multipart';
import fs from 'fs';
import fsPromise from 'fs/promises';
import { pipeline } from 'stream/promises';

const DEFAULT_TRIP_IMAGE_PATH = '/default/default_trip_image.png';
const FILES_URL = 'https://media.smithy.dev/expensr';

export async function doesFileOrFolderExist(path: string) {
  try {
    await fsPromise.stat(path);
    return true;
  } catch {
    return false;
  }
}

export function getTripFileUrl(filePath: string | null) {
  const finalPath = filePath ?? DEFAULT_TRIP_IMAGE_PATH;
  return `${FILES_URL}${finalPath}`;
}

export async function saveTempFile({ file }: MultipartFile, filePath: string): Promise<void> {
  const writeStream = fs.createWriteStream(filePath);

  await pipeline(file, writeStream);

  writeStream.close();
}
