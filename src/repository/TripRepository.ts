import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';
import { DBFindUsersForTripResult, DBTripResult, UsersForTrip } from './TripRepository.types';

class TripRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async findTripsForUserId(userId: number) {
    const results = await this.dbAgent.runQuery<DBTripResult[]>({
      query: `
        SELECT t.id, t.name, t.startDate, t.endDate, t.status, t.image, COALESCE(ROUND(SUM(te.euroAmount), 2), 0) as totalExpenseAmount
        FROM user_trips ut
        LEFT JOIN trips t ON t.id = ut.tripId
        LEFT JOIN trip_expenses te ON te.tripId = t.id
        WHERE ut.userId = ?
        GROUP BY t.id;
      `,
      values: [userId],
    });

    return results;
  }

  async findTripById({ userId, tripId }: { userId: number; tripId: number }): Promise<DBTripResult | null> {
    const [result] = await this.dbAgent.runQuery<DBTripResult[]>({
      query: `
        SELECT t.id, t.name, t.startDate, t.endDate, t.status, t.image, COALESCE(ROUND(SUM(te.amount), 2), 0) as totalLocalAmount, COALESCE(ROUND(SUM(te.euroAmount), 2), 0) as totalExpenseAmount
        FROM user_trips ut
        LEFT JOIN trips t ON t.id = ut.tripId
        LEFT JOIN trip_expenses te ON te.tripId = t.id
        WHERE ut.userId = ?
        AND t.id = ?
        GROUP BY t.id;
      `,
      values: [userId, tripId],
    });

    return result ?? null;
  }

  async findUsersForTrip(tripId: number) {
    const results = await this.dbAgent.runQuery<DBFindUsersForTripResult[]>({
      query: `
        SELECT u.id, u.firstName, u.lastName
        FROM users u
        LEFT JOIN user_trips ut ON ut.userId = u.id
        WHERE ut.tripId = ?
      `,
      values: [tripId],
    });

    return results.reduce<UsersForTrip>((acc, current) => {
      acc[current.id] = {
        firstName: current.firstName,
        lastName: current.lastName,
      };

      return acc;
    }, {});
  }
}

export default TripRepository;
