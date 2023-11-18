import { type FastifyInstance } from 'fastify';
import type UserController from '../controllers/UserController';
import { type GetUsersResponse } from '../controllers/UserController.types';
import { type Router, type ContainerCradle } from '../lib/types';
import { type PossibleErrorResponse } from '../types/routes';

class UserRoutes implements Router {
  controller: UserController;

  constructor({ userController }: ContainerCradle) {
    this.controller = userController;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Reply: PossibleErrorResponse<GetUsersResponse>;
    }>({
      method: 'GET',
      url: '/users',
      handler: this.controller.getUsers,
    });
  }
}

export default UserRoutes;
