import { Env } from '../lib/types';

export default function makeEnv(): Env {
  return {
    SERVER_PORT: process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 3520,
    serviceName: 'Expense Tracker Backend',
    MYSQL_EXPENSE_HOST: process.env.MYSQL_EXPENSE_HOST!,
    MYSQL_EXPENSE_USER: process.env.MYSQL_EXPENSE_USER!,
    MYSQL_EXPENSE_PASSWORD: process.env.MYSQL_EXPENSE_PASSWORD!,
  };
}
