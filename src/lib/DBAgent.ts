import mysql from 'mysql2/promise';

class DBAgent {
  pool: mysql.Pool;

  constructor(mysqlConnectionPool: mysql.Pool) {
    this.pool = mysqlConnectionPool;
  }

  async runQuery<T extends mysql.RowDataPacket[]>({ query, values }: { query: string; values?: Array<string | number> }) {
    const [rows] = await this.pool.execute<T>(query, values);
    return rows;
  }
}

export default DBAgent;
