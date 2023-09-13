import mysql from 'mysql2/promise';
import DBTransaction from './DBTransaction';

interface RunQueryParams {
  query: string;
  values?: Array<string | number>;
}

class DBAgent {
  pool: mysql.Pool;

  constructor(mysqlConnectionPool: mysql.Pool) {
    this.pool = mysqlConnectionPool;
  }

  async runQuery<T extends mysql.RowDataPacket[] | mysql.OkPacket>({ query, values }: RunQueryParams) {
    const [rows] = await this.pool.execute<T>(query, values);
    return rows;
  }

  prepareArrayForInValue(items: Array<string | number>) {
    if (!items.length) return `''`;
    if (typeof items[0] === 'number') return items.join(',');
    else return items.map((i) => `'${i}'`).join(',');
  }

  async createTransaction() {
    const connection = await this.pool.getConnection();
    return new DBTransaction(connection);
  }
}

export default DBAgent;
