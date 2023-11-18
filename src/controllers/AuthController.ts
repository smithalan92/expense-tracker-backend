import { type ContainerCradle } from '../lib/types';
import { isSame } from '../lib/crypto';
import { type PossibleErrorResponse, type RouteHandlerWithBody } from '../types/routes';
import { type LoginRequest, type LoginResponse } from './AuthController.types';
import type UserRepository from '../repository/UserRepository';
import type TokenRepository from '../repository/TokenRepository';

class AuthController {
  userRepository: UserRepository;
  tokenRepository: TokenRepository;

  constructor({ userRepository, tokenRepository }: ContainerCradle) {
    this.userRepository = userRepository;
    this.tokenRepository = tokenRepository;
  }

  login: RouteHandlerWithBody<LoginRequest, PossibleErrorResponse<LoginResponse>> = async (req, reply) => {
    const { email, password } = req.body;

    const user = await this.userRepository.getUserByEmail(email);

    if (!user) {
      return reply.code(401).send({ error: 'Incorrect user name or password' });
    }

    if (!isSame(password, user.password)) {
      return reply.code(401).send({ error: 'Incorrect user name or password' });
    }

    const existingToken = await this.tokenRepository.findValidTokenForUser(user.id);

    if (existingToken) {
      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        token: {
          token: existingToken.token,
          expiry: existingToken.expiry,
        },
      });
    }

    const { token, expiry } = await this.tokenRepository.createUserToken(user.id);

    return reply
      .send({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        token: {
          token,
          expiry,
        },
      })
      .code(200);
  };
}

export default AuthController;
