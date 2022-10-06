import { randomUUID } from 'crypto';
import mysql from 'mysql2';
import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';
import { CreateUserTokenResult, DBFindValidTokenResult, DBUserIDForTokenResult } from './TokenRepository.types';
import { addWeeks, format } from 'date-fns';

class TokenRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async findValidTokenForUser(userId: number): Promise<DBFindValidTokenResult | undefined> {
    const [token]: Array<DBFindValidTokenResult | undefined> = await this.dbAgent.runQuery<DBFindValidTokenResult[]>({
      query: `
        SELECT token, expiry FROM auth_tokens
        WHERE userId = ?
        AND expiry > NOW()
        LIMIT 1;
      `,
      values: [userId],
    });

    return token;
  }

  async createUserToken(userId: number): Promise<CreateUserTokenResult> {
    const token = randomUUID();
    // TODO - This could fuck up due to timezone mismatches
    const expiryDate = format(addWeeks(new Date(), 1), 'yyyy-MM-dd HH-mm-ss'); // Token expiry of 1 week;

    const result = await this.dbAgent.runQuery<mysql.OkPacket>({
      query: `
        INSERT INTO auth_tokens (userId, token, expiry)
        VALUES (?, ?, ?);
      `,
      values: [userId, token, expiryDate],
    });

    if (result.insertId) {
      return {
        token,
        expiry: expiryDate,
      };
    } else {
      throw new Error('Failed to add new token');
    }
  }

  async getUserIdForToken(token: string) {
    const [result] = await this.dbAgent.runQuery<DBUserIDForTokenResult[]>({
      query: `
        SELECT u.id from users u
        LEFT JOIN auth_tokens t ON t.userId = u.id
        WHERE t.token = ?
        AND t.expiry > NOW();
      `,
      values: [token],
    });

    return result ? result.id : null;
  }
}

export default TokenRepository;
