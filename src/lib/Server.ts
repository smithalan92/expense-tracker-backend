import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { fastifyRequestContext } from '@fastify/request-context';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import qs from 'qs';
import type TokenRepository from '../repository/TokenRepository';
import { type ContainerCradle, type Router } from './types';

declare module '@fastify/request-context' {
  interface RequestContextData {
    userId: number;
  }
}

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
    void server.register(fastifyRequestContext, {
      defaultStoreValues: {
        userId: 0,
      },
    });
    void server.register(multipart);

    server.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
      if (request.routeOptions.url === '/login') {
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
      console.log(`\n${request.method.toUpperCase()} ${request.routeOptions.url} ${reply.statusCode}`);
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
