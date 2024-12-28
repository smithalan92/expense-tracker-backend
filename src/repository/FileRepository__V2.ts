import fs from 'fs/promises';
import type mysql from 'mysql2';
import path from 'path';
import type DBAgent from '../lib/DBAgent';
import type DBTransaction from '../lib/DBTransaction';
import knex from '../lib/knex';
import { doesFileOrFolderExist } from '../utils/file';

class FileRepository__V2 {
  dbAgent: DBAgent;
  env: Env;

  constructor({ dbAgent, env }: ContainerCradle) {
    this.dbAgent = dbAgent;
    this.env = env;
  }

  async getUnprocessedFiles() {
    const results = await this.dbAgent.runQuery<DBUnprocessedFileResult[]>({
      query: `
        SELECT id, path
        FROM files
        WHERE processed = 0;
      `,
    });

    return results;
  }

  async updateFile({ id, processed, path }: { id: number; processed?: 0 | 1; path?: string }) {
    let query = knex('files').where('id', id);

    if (processed !== undefined) {
      query = query.update('processed', processed);
    }

    if (path) {
      query = query.update('path', path);
    }

    const result = await this.dbAgent.runQuery<mysql.ResultSetHeader>({
      query: query.toQuery(),
    });

    if (result.changedRows !== 1) {
      throw new Error('Could not update file');
    }
  }

  async saveTempFile(
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
          path: path.join(destPath, fileName),
          uploadedByUserId: userId,
        })
        .toQuery(),
    });

    return insertId;
  }
}

export default FileRepository__V2;

export interface DBUnprocessedFileResult extends mysql.RowDataPacket {
  id: number;
  path: string;
}
