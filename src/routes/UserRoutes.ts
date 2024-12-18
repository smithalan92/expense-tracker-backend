import { type FastifyInstance } from 'fastify';
import type UserRepository from '../repository/UserRepository';
import { type DBUserResult } from '../repository/UserRepository';

class UserRoutes implements Router {
  userRepository: UserRepository;

  constructor({ userRepository }: ContainerCradle) {
    this.userRepository = userRepository;
  }

  configure(server: FastifyInstance) {
    this.makeGetUsersRoute(server);
  }

  makeGetUsersRoute(server: FastifyInstance) {
    server.route<{
      Reply: PossibleErrorResponse<GetUsersResponse>;
    }>({
      method: 'GET',
      url: '/users',
      handler: async (req, reply) => {
        const users = await this.userRepository.getUsers();

        return reply.code(201).send({ users });
      },
    });
  }
}

export default UserRoutes;

export interface GetUsersResponse {
  users: DBUserResult[];
}
