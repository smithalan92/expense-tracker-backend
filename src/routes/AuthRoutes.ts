import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import AuthController from "../controllers/AuthController";
import { Router, ContainerCradle } from "../lib/types";
import { LoginRequest, LoginResponse } from "../controllers/AuthController.types";
import { PossibleErrorResponse } from "../types/routes";

class AuthRoutes implements Router {
  controller: AuthController;

  constructor({ authController }: ContainerCradle) {
    this.controller = authController;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Body: LoginRequest;
      Reply: PossibleErrorResponse<LoginResponse>;
    }>({
      method: "POST",
      url: "/login",
      handler: this.controller.login,
    });
  }
}

export default AuthRoutes;
