import { type FastifyInstance } from 'fastify';
import type AuthRouter from '../routes/AuthRoutes';
import type TripRoutes from '../routes/TripRoutes';
import type AuthController from '../controllers/AuthController';
import type TripController from '../controllers/TripController';
import type TokenRepository from '../repository/TokenRepository';
import type UserRepository from '../repository/UserRepository';
import type TripRepository from '../repository/TripRepository';
import type ExpenseRepository from '../repository/ExpenseRepository';
import type DBAgent from './DBAgent';
import type CurrencyRepository from '../repository/CurrencyRepository';
import type CountryRepository from '../repository/CountryRepository';
import type CityRepository from '../repository/CityRepository';
import type CategoryRepository from '../repository/CategoryRepository';
import type FileController from '../controllers/FileController';
import type FileRepository from '../repository/FileRepository';
import type CountryController from '../controllers/CountryController';
import type UserController from '../controllers/UserController';

export interface Env {
  serviceName: string;
  SERVER_PORT: number;
  MYSQL_EXPENSE_HOST: string;
  MYSQL_EXPENSE_USER: string;
  MYSQL_EXPENSE_PASSWORD: string;
  EXPENSR_TMP_DIR: string;
  EXPENSR_FILE_DIR: string;
}

export interface ContainerCradle {
  env: Env;
  authController: AuthController;
  authRoutes: AuthRouter;
  tripRoutes: TripRoutes;
  tripController: TripController;
  dbAgent: DBAgent;
  userController: UserController;
  userRepository: UserRepository;
  tokenRepository: TokenRepository;
  tripRepository: TripRepository;
  expenseRepository: ExpenseRepository;
  currencyRepository: CurrencyRepository;
  countryController: CountryController;
  countryRepository: CountryRepository;
  cityRepository: CityRepository;
  categoryRepository: CategoryRepository;
  fileController: FileController;
  fileRepository: FileRepository;
}

export interface Router {
  configure: (server: FastifyInstance) => void;
}
