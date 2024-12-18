import type mysql from 'mysql2/promise';
import type DBAgent from '../lib/DBAgent';

class UserRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async getUserByEmail(email: string) {
    const [user] = await this.dbAgent.runQuery<DBUserByEmailResult[]>({
      query: 'SELECT * FROM users WHERE email = ?',
      values: [email],
    });

    return user;
  }

  async getUsers() {
    const users = await this.dbAgent.runQuery<DBUserResult[]>({
      query: 'SELECT id, firstName, lastName FROM users',
    });

    return users;
  }
}

export default UserRepository;

export interface DBUserByEmailResult extends mysql.RowDataPacket {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface DBUserResult extends mysql.RowDataPacket {
  id: number;
  firstName: string;
  lastName: string;
}
