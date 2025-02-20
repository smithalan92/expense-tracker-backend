import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import path from 'path';
import { CountryWithCurrency } from '../../repository/CountryRepository';
import FileRepository from '../../repository/FileRepository';
import { DBUserResult } from '../../repository/UserRepository';
import { saveTempFile } from '../../utils/file';

class UploadFileRoute {
  fileRepository: FileRepository;
  env: Env;

  constructor({ fileRepository, env }: ContainerCradle) {
    this.fileRepository = fileRepository;
    this.env = env;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Reply: PossibleErrorResponse<FileUploadResponse>;
    }>({
      method: 'POST',
      url: '/v2/files/upload',
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

export default UploadFileRoute;

export interface GetAppDataResponse {
  countries: CountryWithCurrency[];
  users: DBUserResult[];
}

export interface FileUploadResponse {
  file: string;
}
