import { type FastifyInstance } from 'fastify';
import type DBAgent from './lib/DBAgent';
import type CategoryRepository from './repository/CategoryRepository';
import type CountryRepository from './repository/CountryRepository';
import type CurrencyRepository from './repository/CurrencyRepository';
import type ExpenseRepository from './repository/ExpenseRepository';
import type FileRepository from './repository/FileRepository';
import type TokenRepository from './repository/TokenRepository';
import type TripRepository from './repository/TripRepository';
import type UserRepository from './repository/UserRepository';

declare global {
  interface Job {
    start: () => void;
    run: () => Promise<void>;
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
    dbAgent: DBAgent;
    categoryRepository: CategoryRepository;
    countryRepository: CountryRepository;
    currencyRepository: CurrencyRepository;
    expenseRepository: ExpenseRepository;
    fileRepository: FileRepository;
    tripRepository: TripRepository;
    tokenRepository: TokenRepository;
    userRepository: UserRepository;
  }

  interface Router {
    configure: (server: FastifyInstance) => void;
  }

  type Nullable<T> = T | null;
}

export {};
