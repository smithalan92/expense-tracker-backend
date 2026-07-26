import { type MultipartFile } from '@fastify/multipart';
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

export class FileTooLargeError extends Error {
  constructor() {
    super('Uploaded file exceeded the maximum allowed size');
    this.name = 'FileTooLargeError';
  }
}

export async function saveFileToDisk(fileData: MultipartFile, filePath: string): Promise<void> {
  const writeStream = fs.createWriteStream(filePath);

  await pipeline(fileData.file, writeStream);

  writeStream.close();

  /*
   * Busboy stops reading once the fileSize limit is hit and ends the stream
   * normally, so the pipeline above resolves having written a partial file.
   * Bail out rather than persisting a corrupt image.
   */
  if (fileData.file.truncated) {
    await fsPromise.rm(filePath, { force: true });
    throw new FileTooLargeError();
  }
}
