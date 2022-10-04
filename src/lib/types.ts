import Hapi from "@hapi/hapi";
import AuthController from "../controllers/AuthController";
import AuthRouter from "../routes/AuthRoutes";
import awilix from 'awilix'
import DBAgent from "./DBAgent";

export interface Env {
  serviceName: string;
  SERVER_PORT: number;
  MYSQL_EXPENSE_HOST: string;
  MYSQL_EXPENSE_USER: string;
  MYSQL_EXPENSE_PASSWORD: string;
}

export interface ContainerCradle {
  env: Env;
  authController: AuthController;
  authRoutes: AuthRouter;
  dbAgent: DBAgent;
}

export interface Router {
  configure: (server: Hapi.Server) => void;
}
