import { RowDataPacket } from 'mysql2/promise';
import type DBAgent from '../lib/DBAgent';
import knex from '../lib/knex';

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

  async getUserIdsForTrip(tripId: number) {
    const query = knex.select('userId').from('user_trips').where('tripId', tripId);

    const results = await this.dbAgent.runQuery<DBUserIDResult[]>({
      query: query.toQuery(),
    });

    return results.map((r) => r.userId);
  }

  async getUserByEmail(email: string) {
    const [user] = await this.dbAgent.runQuery<DBUserByEmailResult[]>({
      query: 'SELECT id, firstName, lastName, password FROM users WHERE email = ?',
      values: [email],
    });

    return user;
  }
}

export default UserRepository__V2;

export interface DBUserResult extends RowDataPacket {
  id: number;
  firstName: string;
  lastName: string;
}

export interface DBUserIDResult extends RowDataPacket {
  userId: number;
}

export interface DBUserByEmailResult extends RowDataPacket {
  id: number;
  firstName: string;
  lastName: string;
  password: string;
}
