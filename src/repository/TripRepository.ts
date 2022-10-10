import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';

class TripRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  // async getUserIdForToken(token: string) {
  //   const [result] = await this.dbAgent.runQuery<DBUserIDForTokenResult[]>({
  //     query: `
  //       SELECT u.id from users u
  //       LEFT JOIN auth_tokens t ON t.userId = u.id
  //       WHERE t.token = ?
  //       AND t.expiry > NOW();
  //     `,
  //     values: [token],
  //   });

  //   return result ? result.id : null;
  // }
}

export default TripRepository;
