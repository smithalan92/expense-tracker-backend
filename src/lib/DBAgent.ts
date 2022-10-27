import mysql from 'mysql2/promise';

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
    if (typeof items[0] === 'number') return items.join(',');
    else return items.map((i) => `'${i}'`).join(',');
  }
}

export default DBAgent;
