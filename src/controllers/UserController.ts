import { type PossibleErrorResponse, type RouteHandler } from '../types/routes';
import { type ContainerCradle } from '../lib/types';
import type UserRepository from '../repository/UserRepository';
import { type GetUsersResponse } from './UserController.types';

class UserController {
  userRepository: UserRepository;

  constructor({ userRepository }: ContainerCradle) {
    this.userRepository = userRepository;
  }

  getUsers: RouteHandler<PossibleErrorResponse<GetUsersResponse>> = async (req, reply) => {
    const users = await this.userRepository.getUsers();

    return reply.code(201).send({ users });
  };
}

export default UserController;
