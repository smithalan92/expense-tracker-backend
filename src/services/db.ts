import mysql from 'mysql2/promise';

export default function makePool({ env }: ContainerCradle) {
  const pool = mysql.createPool({
    host: env.MYSQL_EXPENSE_HOST,
    password: env.MYSQL_EXPENSE_PASSWORD,
    user: env.MYSQL_EXPENSE_USER,
    database: 'expense_tracker',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
}
