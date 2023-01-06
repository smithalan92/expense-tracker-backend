import { FastifyInstance } from 'fastify';
import UserController from '../controllers/UserController';
import { GetUsersResponse } from '../controllers/UserController.types';
import { Router, ContainerCradle } from '../lib/types';
import { PossibleErrorResponse } from '../types/routes';

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
