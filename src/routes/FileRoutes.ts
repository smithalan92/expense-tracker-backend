import { randomUUID } from 'crypto';
import { type FastifyInstance } from 'fastify';
import path from 'path';
import { saveTempFile } from '../utils/file';

class FileRoutes implements Router {
  env: Env;

  constructor({ env }: ContainerCradle) {
    this.env = env;
  }

  configure(server: FastifyInstance) {
    this.makeFileUploadRoute(server);
  }

  makeFileUploadRoute(server: FastifyInstance) {
    server.route<{
      Reply: PossibleErrorResponse<FileUploadResponse>;
    }>({
      method: 'POST',
      url: '/files/upload',
      handler: async (req, reply) => {
        const fileData = await req.file();

        if (!fileData) {
          return reply.code(400).send({ error: 'No file included in request' });
        }

        const [extension] = fileData.filename.match(/\.\w+$/)!;

        const fileName = `${randomUUID()}${extension}`;

        await saveTempFile(fileData, path.join(this.env.EXPENSR_TMP_DIR, fileName));

        return reply.code(201).send({ file: fileName });
      },
    });
  }
}

export default FileRoutes;

export interface FileUploadResponse {
  file: string;
}
