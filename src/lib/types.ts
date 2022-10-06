import { FastifyInstance } from 'fastify';
import AuthController from '../controllers/AuthController';
import UserRepository from '../repository/UserRepository';
import AuthRouter from '../routes/AuthRoutes';
import DBAgent from './DBAgent';

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
  userRepository: UserRepository;
}

export interface Router {
  configure: (server: FastifyInstance) => void;
}
