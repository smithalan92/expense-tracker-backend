import fs from 'fs/promises';
import mysql from 'mysql2';
import DBAgent from '../lib/DBAgent';
import { ContainerCradle, Env } from '../lib/types';
import { doesFileOrFolderExist } from '../utils/file';
import knex from '../lib/knex';
import path from 'path';
import DBTransaction from '../lib/DBTransaction';

class FileRepository {
  dbAgent: DBAgent;
  env: Env;

  constructor({ dbAgent, env }: ContainerCradle) {
    this.dbAgent = dbAgent;
    this.env = env;
  }

  async saveTempFile({ userId, fileName, destPath }: { userId: number; fileName: string; destPath: string }, transaction?: DBTransaction) {
    const doesDestPathExist = await doesFileOrFolderExist(destPath);

    if (!doesDestPathExist) {
      await fs.mkdir(destPath);
    }

    await fs.copyFile(path.join(this.env.EXPENSR_TMP_DIR, fileName), path.join(destPath, fileName));

    const { insertId } = await (transaction ?? this.dbAgent).runQuery<mysql.OkPacket>({
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

export default FileRepository;
