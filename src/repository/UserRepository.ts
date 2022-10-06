import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';
import { DBUserResult } from './UserRepository.types';

class UserRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async getUserByEmail(email: string) {
    const [user] = await this.dbAgent.runQuery<DBUserResult[]>({
      query: 'SELECT * FROM users WHERE email = ?',
      values: [email],
    });

    return user;
  }
}

export default UserRepository;
