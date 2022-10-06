import { ContainerCradle } from '../lib/types';
import { isSame } from '../lib/crypto';
import { PossibleErrorResponse, RouteHandler } from '../types/routes';
import { LoginRequest, LoginResponse } from './AuthController.types';
import UserRepository from '../repository/UserRepository';
import TokenRepository from '../repository/TokenRepository';

class AuthController {
  userRepository: UserRepository;
  tokenRepository: TokenRepository;

  constructor({ userRepository, tokenRepository }: ContainerCradle) {
    this.userRepository = userRepository;
    this.tokenRepository = tokenRepository;
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

    const existingToken = await this.tokenRepository.findValidTokenForUser(user.id);

    if (existingToken) {
      return reply
        .send({
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
        })
        .code(200);
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
