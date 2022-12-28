import fs from 'fs/promises';

const DEFAULT_TRIP_IMAGE_PATH = '/default/default_trip_image.png';
const FILES_URL = 'https://media.smithy.dev/expensr';

export async function doesFileOrFolderExist(path: string) {
  try {
    await fs.stat(path);
    return true;
  } catch {
    return false;
  }
}

export function getTripFileUrl(filePath: string | null) {
  const finalPath = filePath ?? DEFAULT_TRIP_IMAGE_PATH;
  return `${FILES_URL}${finalPath}`;
}
