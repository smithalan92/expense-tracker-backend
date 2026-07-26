import fs from 'fs/promises';
import type mysql from 'mysql2';
import path from 'path';
import type DBAgent from '../lib/DBAgent';
import type DBTransaction from '../lib/DBTransaction';
import knex from '../lib/knex';
import { doesFileOrFolderExist } from '../utils/file';

class FileRepository {
  dbAgent: DBAgent;
  env: Env;

  constructor({ dbAgent, env }: ContainerCradle) {
    this.dbAgent = dbAgent;
    this.env = env;
  }

  async saveFile(
    { userId, fileName, destPath }: { userId: number; fileName: string; destPath: string },
    transaction?: DBTransaction,
  ) {
    const fullDestPath = path.join(this.env.EXPENSR_FILE_DIR, destPath);
    const doesDestPathExist = await doesFileOrFolderExist(fullDestPath);

    if (!doesDestPathExist) {
      await fs.mkdir(fullDestPath);
    }

    await fs.copyFile(path.join(this.env.EXPENSR_TMP_DIR, fileName), path.join(fullDestPath, fileName));

    const { insertId } = await (transaction ?? this.dbAgent).runQuery<mysql.ResultSetHeader>({
      query: knex('files')
        .insert({
          // Images are resized during upload, so nothing arrives here unprocessed.
          processed: 1,
          path: path.join(destPath, fileName),
          uploadedByUserId: userId,
        })
        .toQuery(),
    });

    return insertId;
  }
}

export default FileRepository;
