import Hapi, { Request, ResponseToolkit } from "@hapi/hapi";
import { Env, Router } from "./types";

class Server {
  server: Hapi.Server;

  constructor({ env }: { env: Env }) {
    this.server = this.createServer(env.SERVER_PORT);
  }

  createServer(port: number) {
    const server = Hapi.server({
      port: port,
      host: "localhost",
      routes: {
        cors: true,
      },
    });

    server.ext("onRequest", (request: Request, h: ResponseToolkit) => {
      if (request.method === "options") {
        const response = h.response({});
        response.header("Access-Control-Allow-Origin", "*");
        response.header("Access-Control-Allow-Headers", "*");
        return h.response(response).takeover();
      }

      return h.continue;
    });

    server.ext("onPreResponse", (request, h) => {
      // Cant get the correct type for req.response?
      const { response }: { response: any } = request;

      if (response && response.isBoom && response.isServer) {
        const error = response.error || response.message;

        if (!response.data) {
          console.error(error);
          console.log(response.stack);
        }
      }

      return response;
    });

    server.events.on("response", (req) => {
      // @ts-ignore - Cant get the correct type for req.response?
      console.log(`${req.method.toUpperCase()} ${req.path} ${req.response.statusCode}`);
    });

    return server;
  }

  registerRoutes(routes: Router) {
    routes.configure(this.server);
  }

  async start() {
    await this.server.start();
  }
}

export default Server;
