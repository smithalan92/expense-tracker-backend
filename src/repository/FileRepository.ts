import fs from 'fs/promises';
import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';

class FileRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  saveTempFile(tempFile: string, destFolder: string) {}

  insertFileRecord(filePath: string) {}
}

export default FileRepository;
