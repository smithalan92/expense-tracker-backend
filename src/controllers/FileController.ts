import { PossibleErrorResponse, RouteHandler } from '../types/routes';
import { FileUploadResponse } from './FileController.types';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import { ContainerCradle, Env } from '../lib/types';
import pump from 'pump';

class FileController {
  env: Env;

  constructor({ env }: ContainerCradle) {
    this.env = env;
  }

  upload: RouteHandler<PossibleErrorResponse<FileUploadResponse>> = async (req, reply) => {
    const data = await req.file();

    if (!data) {
      return reply.code(400).send({ error: 'No file included in request' });
    }

    const { filename, file } = data;

    const [extension] = filename.match(/\.\w+$/)!;

    const fileName = `${randomUUID()}${extension}`;

    const writeStream = fs.createWriteStream(path.join(this.env.EXPENSR_TMP_DIR, fileName));
    await pump(file, writeStream);

    return reply.code(201).send({ file: fileName });
  };
}

export default FileController;
