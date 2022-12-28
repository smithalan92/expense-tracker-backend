import mysql from 'mysql2/promise';

class DBTransaction {
  connection: mysql.PoolConnection;

  constructor(connection: mysql.PoolConnection) {
    this.connection = connection;
  }

  async begin() {
    await this.connection.beginTransaction();
  }

  async runQuery<T extends mysql.RowDataPacket[] | mysql.OkPacket>({ query, values }: any) {
    const [rows] = await this.connection.execute<T>(query, values);
    return rows;
  }

  async rollback() {
    await this.connection.rollback();
    await this.connection.release();
  }

  async commit() {
    await this.connection.commit();
    await this.connection.release();
  }
}

export default DBTransaction;
