import { FastifyInstance } from 'fastify';
import { isSame } from '../../lib/crypto';
import { CountryWithCurrency } from '../../repository/CountryRepository';
import { DBCurrency } from '../../repository/CurrencyRepository';
import TokenRepository from '../../repository/TokenRepository';
import UserRepository, { DBUserResult } from '../../repository/UserRepository';

class LoginRoute {
  userRepository: UserRepository;
  tokenRepository: TokenRepository;

  constructor({ userRepository, tokenRepository }: ContainerCradle) {
    this.userRepository = userRepository;
    this.tokenRepository = tokenRepository;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Body: LoginRequest;
      Reply: PossibleErrorResponse<LoginResponse>;
    }>({
      method: 'POST',
      url: '/v2/login',
      handler: async (req, reply) => {
        const { email, password } = req.body;

        if (!email || !password) {
          return reply.code(400).send({ error: 'Email and password are required' });
        }

        const user = await this.userRepository.getUserByEmail(email);

        if (!user) {
          return reply.code(401).send({ error: 'Incorrect user name or password' });
        }

        if (!isSame(password, user.password)) {
          return reply.code(401).send({ error: 'Incorrect user name or password' });
        }

        let tokenToUse = await this.tokenRepository.findValidTokenForUser(user.id);

        if (!tokenToUse) {
          const data = await this.tokenRepository.createUserToken(user.id);

          tokenToUse = { token: data.token, expiry: data.expiry };
        }

        return reply.send({
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          token: tokenToUse,
        });
      },
    });
  }
}

export default LoginRoute;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GetAppDataResponse {
  countries: CountryWithCurrency[];
  users: DBUserResult[];
  currencies: DBCurrency[];
}

export interface LoginUser {
  id: number;
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
