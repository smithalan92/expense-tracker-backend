import type mysql from 'mysql2/promise';
import type DBAgent from '../lib/DBAgent';

class UserRepository__V2 {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async getUsers() {
    const users = await this.dbAgent.runQuery<DBUserResult[]>({
      query: 'SELECT id, firstName, lastName FROM users',
    });

    return users;
  }
}

export default UserRepository__V2;

export interface DBUserResult extends mysql.RowDataPacket {
  id: number;
  firstName: string;
  lastName: string;
}
