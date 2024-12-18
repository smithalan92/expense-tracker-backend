import { type FastifyInstance } from 'fastify';
import { isSame } from '../lib/crypto';
import type TokenRepository from '../repository/TokenRepository';
import type UserRepository from '../repository/UserRepository';

class AuthRoutes implements Router {
  userRepository: UserRepository;
  tokenRepository: TokenRepository;

  constructor({ userRepository, tokenRepository }: ContainerCradle) {
    this.userRepository = userRepository;
    this.tokenRepository = tokenRepository;
  }

  configure(server: FastifyInstance) {
    this.makeLoginRoute(server);
  }

  makeLoginRoute(server: FastifyInstance) {
    server.route<{
      Body: LoginRequest;
      Reply: PossibleErrorResponse<LoginResponse>;
    }>({
      method: 'POST',
      url: '/login',
      handler: async (req, reply) => {
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
      },
    });
  }
}

export default AuthRoutes;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface LoginToken {
  expiry: string;
  token: string;
}

export interface LoginResponse {
  user: LoginUser;
  token: LoginToken;
}
