import { type FastifyInstance } from 'fastify';
import type AuthController from '../controllers/AuthController';
import { type Router, type ContainerCradle } from '../lib/types';
import { type LoginRequest, type LoginResponse } from '../controllers/AuthController.types';
import { type PossibleErrorResponse } from '../types/routes';

class AuthRoutes implements Router {
  controller: AuthController;

  constructor({ authController }: ContainerCradle) {
    this.controller = authController;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Body: LoginRequest;
      Reply: PossibleErrorResponse<LoginResponse>;
    }>({
      method: 'POST',
      url: '/login',
      handler: this.controller.login,
    });
  }
}

export default AuthRoutes;
