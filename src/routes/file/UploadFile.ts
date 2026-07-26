import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import path from 'path';
import { CountryWithCurrency } from '../../repository/CountryRepository';
import FileRepository from '../../repository/FileRepository';
import { DBUserResult } from '../../repository/UserRepository';
import { FileTooLargeError, saveFileToDisk } from '../../utils/file';
import { normaliseUploadedImage, UnprocessableImageError } from '../../utils/image';

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

        const [extension] = /\.\w+$/.exec(fileData.filename)!;

        const uploadedFileName = `${randomUUID()}${extension}`;

        try {
          await saveFileToDisk(fileData, path.join(this.env.EXPENSR_TMP_DIR, uploadedFileName));
        } catch (err) {
          if (err instanceof FileTooLargeError) {
            return reply.code(413).send({ error: 'File is too large' });
          }
          throw err;
        }

        try {
          const fileName = await normaliseUploadedImage(this.env.EXPENSR_TMP_DIR, uploadedFileName);
          return reply.code(201).send({ file: fileName });
        } catch (err) {
          if (err instanceof UnprocessableImageError) {
            return reply.code(415).send({ error: 'File is not a supported image' });
          }
          throw err;
        }
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
