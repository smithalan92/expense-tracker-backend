import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import cors from "@fastify/cors";
import { Env, Router } from "./types";

class Server {
  server: FastifyInstance;
  port: number;

  constructor({ env }: { env: Env }) {
    this.server = this.createServer();
    this.port = env.SERVER_PORT;
  }

  createServer() {
    const server = Fastify({
      logger: {
        level: "info",
      },
    });

    server.register(cors);

    server.addHook("onResponse", (request: FastifyRequest, reply: FastifyReply, done) => {
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
