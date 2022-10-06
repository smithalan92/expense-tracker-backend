import { FastifyInstance } from 'fastify';
import AuthController from '../controllers/AuthController';
import { Router, ContainerCradle } from '../lib/types';
import { LoginRequest, LoginResponse } from '../controllers/AuthController.types';
import { PossibleErrorResponse } from '../types/routes';

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

    server.route({
      method: 'GET',
      url: '/test',
      handler: (req, reply) => {
        const user: { id: number } = req.requestContext.get('user');
        return reply.send({ user }).code(200);
      },
    });
  }
}

export default AuthRoutes;
