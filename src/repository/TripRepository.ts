import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';
import { CreateTripParams, DBFindUsersForTripResult, DBTripResult, UsersForTrip } from './TripRepository.types';
import knex from '../lib/knex';
import mysql from 'mysql2';

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

  async createTrip({ name, startDate, endDate, file, countryIds, userIds }: CreateTripParams) {
    const transaction = await this.dbAgent.createTransaction();

    await transaction.begin();

    try {
      const { insertId: tripId } = await transaction.runQuery<mysql.OkPacket>({
        query: knex('trips')
          .insert({
            name,
            startDate,
            endDate,
            status: 'active',
          })
          .toQuery(),
      });

      const countryInserts = countryIds.reduce<Array<{ tripId: Number; countryId: number }>>((acc, current) => {
        acc.push({ tripId, countryId: current });
        return acc;
      }, []);

      const userInserts = userIds.reduce<Array<{ tripId: Number; userId: number }>>((acc, current) => {
        acc.push({ tripId, userId: current });
        return acc;
      }, []);

      await Promise.all([
        transaction.runQuery({
          query: knex('trip_countries').insert(countryInserts).toQuery(),
        }),
        transaction.runQuery({
          query: knex('user_trips').insert(userInserts).toQuery(),
        }),
      ]);

      await transaction.end();

      return tripId;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

export default TripRepository;
