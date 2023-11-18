import { type FastifyInstance } from 'fastify';
import type FileController from '../controllers/FileController';
import { type Router, type ContainerCradle } from '../lib/types';
import { type PossibleErrorResponse } from '../types/routes';
import { type FileUploadResponse } from '../controllers/FileController.types';

class FileRoutes implements Router {
  controller: FileController;

  constructor({ fileController }: ContainerCradle) {
    this.controller = fileController;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Reply: PossibleErrorResponse<FileUploadResponse>;
    }>({
      method: 'POST',
      url: '/files/upload',
      handler: this.controller.upload,
    });
  }
}

export default FileRoutes;
