import { type FastifyInstance } from 'fastify';
import type DBAgent from './lib/DBAgent';
import type CategoryRepository from './repository/CategoryRepository';
import type CityRepository from './repository/CityRepository';
import type CountryRepository from './repository/CountryRepository';
import type CurrencyRepository from './repository/CurrencyRepository';
import type ExpenseRepository from './repository/ExpenseRepository';
import type FileRepository from './repository/FileRepository';
import type TokenRepository from './repository/TokenRepository';
import type TripRepository from './repository/TripRepository';
import type UserRepository from './repository/UserRepository';
import type AuthRouter from './routes/AuthRoutes';
import type TripRoutes from './routes/TripRoutes';

declare global {
  interface Job {
    start: () => void;
    run: () => void;
  }

  interface ErrorResponse {
    error: string;
  }

  type PossibleErrorResponse<T = unknown> = T | ErrorResponse;

  interface Env {
    serviceName: string;
    SERVER_PORT: number;
    MYSQL_EXPENSE_HOST: string;
    MYSQL_EXPENSE_USER: string;
    MYSQL_EXPENSE_PASSWORD: string;
    EXPENSR_TMP_DIR: string;
    EXPENSR_FILE_DIR: string;
  }

  interface ContainerCradle {
    env: Env;
    authRoutes: AuthRouter;
    tripRoutes: TripRoutes;
    dbAgent: DBAgent;
    userRepository: UserRepository;
    tokenRepository: TokenRepository;
    tripRepository: TripRepository;
    expenseRepository: ExpenseRepository;
    currencyRepository: CurrencyRepository;
    countryRepository: CountryRepository;
    cityRepository: CityRepository;
    categoryRepository: CategoryRepository;
    fileRepository: FileRepository;
  }

  interface Router {
    configure: (server: FastifyInstance) => void;
  }
}

export {};
