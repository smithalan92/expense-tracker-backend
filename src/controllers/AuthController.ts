import { ContainerCradle } from '../lib/types';
import { isSame } from '../lib/crypto';
import { PossibleErrorResponse, RouteHandler } from '../types/routes';
import { LoginRequest, LoginResponse } from './AuthController.types';
import UserRepository from '../repository/UserRepository';

class AuthController {
  userRepository: UserRepository;

  constructor({ userRepository }: ContainerCradle) {
    this.userRepository = userRepository;
  }

  login: RouteHandler<LoginRequest, PossibleErrorResponse<LoginResponse>> = async (req, reply) => {
    const { email, password } = req.body;

    const user = await this.userRepository.getUserByEmail(email);

    if (!user) {
      return reply.send({ error: 'Incorrect user name or password' }).code(401);
    }

    if (!isSame(password, user.password)) {
      return reply.send({ error: 'Incorrect user name or password' }).code(401);
    }

    return reply
      .send({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        token: '1234',
      })
      .code(200);
  };
}

export default AuthController;
