import { FastifyInstance } from 'fastify';
import FileController from '../controllers/FileController';
import { Router, ContainerCradle } from '../lib/types';
import { PossibleErrorResponse } from '../types/routes';
import { FileUploadResponse } from '../controllers/FileController.types';

class AuthRoutes implements Router {
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

export default AuthRoutes;
