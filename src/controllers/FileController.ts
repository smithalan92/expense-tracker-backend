import { randomUUID } from 'crypto';
import path from 'path';
import { type ContainerCradle, type Env } from '../lib/types';
import { type PossibleErrorResponse, type RouteHandler } from '../types/routes';
import { saveTempFile } from '../utils/file';
import { type FileUploadResponse } from './FileController.types';

class FileController {
  env: Env;

  constructor({ env }: ContainerCradle) {
    this.env = env;
  }

  upload: RouteHandler<PossibleErrorResponse<FileUploadResponse>> = async (req, reply) => {
    const fileData = await req.file();

    if (!fileData) {
      return reply.code(400).send({ error: 'No file included in request' });
    }

    const [extension] = fileData.filename.match(/\.\w+$/)!;

    const fileName = `${randomUUID()}${extension}`;

    await saveTempFile(fileData, path.join(this.env.EXPENSR_TMP_DIR, fileName));

    return reply.code(201).send({ file: fileName });
  };
}

export default FileController;
