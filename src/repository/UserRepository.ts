import type DBAgent from '../lib/DBAgent';
import { type ContainerCradle } from '../lib/types';
import { type DBUserByEmailResult, type DBUserResult } from './UserRepository.types';

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
