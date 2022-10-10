import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';
import { DBTripResult } from './TripRepository.types';

class TripRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async findTripsForUserId(userId: number) {
    const results = await this.dbAgent.runQuery<DBTripResult[]>({
      query: `
        SELECT t.id, t.name, t.startDate, t.endDate, t.status
        FROM user_trips ut
        LEFT JOIN trips t ON t.id = ut.tripId
        WHERE ut.userId = ?;`,
      values: [userId],
    });

    return results;
  }
}

export default TripRepository;
