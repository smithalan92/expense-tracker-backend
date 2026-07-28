import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { fastifyRequestContext } from '@fastify/request-context';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import qs from 'qs';
import type TokenRepository from '../repository/TokenRepository';

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
      // Router options must be nested under routerOptions; the top-level form
      // warns with FSTDEP022 and is removed in fastify@6.
      routerOptions: {
        querystringParser: (str) => qs.parse(str, { comma: true }),
      },
      logger: {
        level: 'info',
      },
    });

    void server.register(cors, {
      origin: true,
      methods: ['GET', 'HEAD', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    });

    void server.register(fastifyRequestContext, {
      defaultStoreValues: {
        userId: 0,
      },
    });
    // Without an explicit fileSize, @fastify/multipart falls back to Fastify's
    // bodyLimit (1MiB) and silently truncates anything larger. Phone photos are
    // routinely 5-15MB, so allow 25MB.
    void server.register(multipart, {
      limits: {
        fileSize: 25 * 1024 * 1024,
      },
    });

    server.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
      if (request.url.endsWith('/login') || request.method === 'OPTIONS') {
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
