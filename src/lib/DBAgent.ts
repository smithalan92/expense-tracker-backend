import mysql from 'mysql2/promise';

interface RunQueryParams {
  query: string;
  values?: Array<string | number> | Array<Array<string | number>>;
}

class DBAgent {
  pool: mysql.Pool;

  constructor(mysqlConnectionPool: mysql.Pool) {
    this.pool = mysqlConnectionPool;
  }

  async runQuery<T extends mysql.RowDataPacket[] | mysql.OkPacket>({ query, values }: RunQueryParams) {
    // Flatten nested arrays
    const valuesToUse = values?.map((v) => {
      return Array.isArray(v) ? v.join(',') : v;
    });

    const [rows] = await this.pool.execute<T>(query, valuesToUse);
    return rows;
  }
}

export default DBAgent;
