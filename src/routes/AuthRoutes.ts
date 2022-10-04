import { Server } from "@hapi/hapi";
import AppController from "../controllers/AuthController";
import { Router, ContainerCradle } from "../lib/types";

class AuthRoutes implements Router {
  controller: AppController;

  constructor({ authController }: ContainerCradle) {
    this.controller = authController;
  }

  configure(server: Server) {
    server.route({
      method: "POST",
      path: "/login",
      handler: this.controller.login.bind(this.controller),
    });
  }
}

export default AuthRoutes;
