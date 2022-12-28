import fs from 'fs/promises';

export async function doesFileExist(filePath: string) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}
