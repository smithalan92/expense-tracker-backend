import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import qs from 'qs';
import cors from '@fastify/cors';
import { ContainerCradle, Router } from './types';
import TokenRepository from '../repository/TokenRepository';
import { fastifyRequestContextPlugin } from '@fastify/request-context';

class Server {
  server: FastifyInstance;
  port: number;
  tokenRepository: TokenRepository;

  constructor({ env, tokenRepository }: ContainerCradle) {
    this.server = this.createServer();
    this.port = env.SERVER_PORT;
    this.tokenRepository = tokenRepository;
  }

  createServer() {
    const server = Fastify({
      querystringParser: (str) => qs.parse(str, { comma: true }),
      logger: {
        level: 'info',
      },
    });

    void server.register(cors);
    void server.register(fastifyRequestContextPlugin, {
      defaultStoreValues: {
        userId: 0,
      },
    });

    server.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
      if (request.routerPath === '/login') {
        return;
      }

      const token = request.headers.authorization;

      if (!token) {
        return reply.code(401).send({ error: 'Not authorised' });
      }

      const userId = await this.tokenRepository.getUserIdForToken(token);

      if (!userId) {
        return reply.code(401).send({ error: 'Not authorised' });
      }

      request.requestContext.set('userId', userId);
    });

    server.addHook('onResponse', (request: FastifyRequest, reply: FastifyReply, done) => {
      console.log(`${request.method.toUpperCase()} ${request.routerPath} ${reply.statusCode}`);
      done();
    });

    return server;
  }

  registerRoutes(routes: Router) {
    routes.configure(this.server);
  }

  async start() {
    await this.server.listen({ port: this.port });
  }
}

export default Server;
