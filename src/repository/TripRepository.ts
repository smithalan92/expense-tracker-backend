import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';
import { CreateTripParams, DBFindUsersForTripResult, DBTripResult, UsersForTrip } from './TripRepository.types';
import knex from '../lib/knex';
import mysql from 'mysql2';
import DBTransaction from '../lib/DBTransaction';

class TripRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async findTripsForUserId(userId: number, tripId?: number) {
    let query = knex
      .select(
        knex.raw(
          `t.id, t.name, t.startDate, t.endDate, t.status, f.path as filePath, COALESCE(ROUND(SUM(te.euroAmount), 2), 0) as totalExpenseAmount`
        )
      )
      .from('user_trips AS ut')
      .leftJoin('trips AS t', 't.id', 'ut.tripId')
      .leftJoin('trip_expenses AS te', 'te.tripId', 't.id')
      .leftJoin('files AS f', 'f.id', 't.fileId')
      .where('ut.userId', userId)
      .groupBy('t.id');

    if (tripId) {
      query = query.where('t.id', tripId);
    }

    const results = await this.dbAgent.runQuery<DBTripResult[]>({
      query: query.toQuery(),
    });

    return results;
  }

  async findTripById({ userId, tripId }: { userId: number; tripId: number }): Promise<DBTripResult | null> {
    const [result] = await this.dbAgent.runQuery<DBTripResult[]>({
      query: `
        SELECT t.id, t.name, t.startDate, t.endDate, t.status, f.path as filePath, COALESCE(ROUND(SUM(te.amount), 2), 0) as totalLocalAmount, COALESCE(ROUND(SUM(te.euroAmount), 2), 0) as totalExpenseAmount
        FROM user_trips ut
        LEFT JOIN trips t ON t.id = ut.tripId
        LEFT JOIN trip_expenses te ON te.tripId = t.id
        LEFT JOIN files f on f.id = t.fileId
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

  async createTrip({ name, startDate, endDate, countryIds, userIds }: CreateTripParams, transaction?: DBTransaction) {
    let transactionToUse = transaction;

    if (!transactionToUse) {
      transactionToUse = await this.dbAgent.createTransaction();
    }

    await transactionToUse.begin();

    try {
      const { insertId: tripId } = await transactionToUse.runQuery<mysql.OkPacket>({
        query: knex('trips')
          .insert({
            name,
            startDate,
            endDate,
            status: 'active',
          })
          .toQuery(),
      });

      console.log('here, tripId is ', tripId);

      const countryInserts = countryIds.reduce<Array<{ tripId: Number; countryId: number }>>((acc, current) => {
        acc.push({ tripId, countryId: current });
        return acc;
      }, []);

      const userInserts = userIds.reduce<Array<{ tripId: Number; userId: number }>>((acc, current) => {
        acc.push({ tripId, userId: current });
        return acc;
      }, []);

      await Promise.all([
        transactionToUse.runQuery({
          query: knex('trip_countries').insert(countryInserts).toQuery(),
        }),
        transactionToUse.runQuery({
          query: knex('user_trips').insert(userInserts).toQuery(),
        }),
      ]);

      if (!transaction) {
        await transactionToUse.commit();
      }

      return tripId;
    } catch (err) {
      if (!transaction) {
        await transactionToUse.rollback();
      }
      throw err;
    }
  }

  async updateTrip({ fileId, tripId }: { fileId: number; tripId: number }, transaction?: DBTransaction) {
    return (transaction ?? this.dbAgent).runQuery({
      query: knex('trips').where('id', tripId).update('fileId', fileId).toQuery(),
    });
  }
}

export default TripRepository;
