import type mysql from 'mysql2/promise';

class DBTransaction {
  connection: mysql.PoolConnection;
  hasStarted: boolean;

  constructor(connection: mysql.PoolConnection) {
    this.connection = connection;
    this.hasStarted = false;
  }

  async begin() {
    await this.connection.beginTransaction();
    this.hasStarted = true;
  }

  async runQuery<T extends mysql.RowDataPacket[] | mysql.ResultSetHeader>({
    query,
    values,
  }: {
    query: string;
    values?: unknown[];
  }) {
    const [rows] = await this.connection.execute<T>(query, values);
    return rows;
  }

  async rollback() {
    await this.connection.rollback();
    this.connection.release();
    this.hasStarted = false;
  }

  async commit() {
    await this.connection.commit();
    this.connection.release();
  }
}

export default DBTransaction;
