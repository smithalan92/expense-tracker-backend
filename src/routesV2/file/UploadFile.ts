import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import path from 'path';
import { CountryWithCurrency } from '../../repository/CountryRepository__V2';
import FileRepository__V2 from '../../repository/FileRepository__V2';
import { DBUserResult } from '../../repository/UserRepository__V2';
import { saveTempFile } from '../../utils/file';

class UploadFileRoute {
  fileRepository: FileRepository__V2;
  env: Env;

  constructor({ fileRepositoryV2, env }: ContainerCradle) {
    this.fileRepository = fileRepositoryV2;
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
