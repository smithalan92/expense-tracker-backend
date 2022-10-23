import { FastifyInstance } from 'fastify';
import AuthRouter from '../routes/AuthRoutes';
import TripRoutes from '../routes/TripRoutes';
import AuthController from '../controllers/AuthController';
import TripController from '../controllers/TripController';
import TokenRepository from '../repository/TokenRepository';
import UserRepository from '../repository/UserRepository';
import TripRepository from '../repository/TripRepository';
import ExpenseRepository from '../repository/ExpenseRepository';
import DBAgent from './DBAgent';
import CurrencyRepository from '../repository/CurrencyRepository';
import CountryRepository from '../repository/CountryRepository';
import CityRepository from '../repository/CityRepository';
import CountryController from '../controllers/CountryController';
import CurrencyController from '../controllers/CurrencyController';

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
  tripRoutes: TripRoutes;
  tripController: TripController;
  countryController: CountryController;
  currencyController: CurrencyController;
  dbAgent: DBAgent;
  userRepository: UserRepository;
  tokenRepository: TokenRepository;
  tripRepository: TripRepository;
  expenseRepository: ExpenseRepository;
  currencyRepository: CurrencyRepository;
  countryRepository: CountryRepository;
  cityRepository: CityRepository;
}

export interface Router {
  configure: (server: FastifyInstance) => void;
}
