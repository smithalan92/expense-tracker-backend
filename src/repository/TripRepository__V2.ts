import type mysql from 'mysql2';
import { ResultSetHeader } from 'mysql2';
import type DBAgent from '../lib/DBAgent';
import DBTransaction from '../lib/DBTransaction';
import knex from '../lib/knex';

class TripRepository__V2 {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async getTrips({ userId, tripIds, includeDeleted }: GetTripsFilters) {
    const query = knex
      .select(
        't.id',
        't.name',
        't.startDate',
        't.endDate',
        'f.path as filePath',
        knex.raw('IFNULL(ROUND(SUM(te.euroAmount)),0) as totalExpenseAmount'),
      )
      .from({ t: 'trips' })
      .leftJoin({ ut: 'user_trips' }, 'ut.tripId', 't.id')
      .leftJoin({ f: 'files' }, 'f.id', 't.fileId')
      .leftJoin({ te: 'trip_expenses' }, 'te.tripId', 't.id')
      .groupBy('t.id')
      .orderBy('t.startDate', 'desc');

    if (!includeDeleted) {
      query.where('t.status', 'active');
    }

    if (userId) {
      query.where('ut.userId', userId);
    }

    if (tripIds?.length) {
      query.whereIn('t.id', tripIds);
    }

    const results = await this.dbAgent.runQuery<DBGetTripsResult[]>({
      query: query.toQuery(),
    });

    return results;
  }

  async createTrip(
    { name, startDate, endDate, countries, fileId, userIds }: CreateTripParams,
    transaction: DBTransaction,
  ) {
    const { insertId: tripId } = await transaction.runQuery<ResultSetHeader>({
      query: knex('trips')
        .insert({
          name,
          startDate,
          endDate,
          status: 'active',
          fileId,
        })
        .toQuery(),
    });

    const countryInserts = countries.reduce<Array<{ tripId: number; countryId: number; cityIds: string | null }>>(
      (acc, current) => {
        const cityIds = current.cityIds?.join(',') ?? null;

        acc.push({ tripId, countryId: current.countryId, cityIds });
        return acc;
      },
      [],
    );

    const userInserts = userIds.reduce<Array<{ tripId: number; userId: number }>>((acc, current) => {
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

    return tripId;
  }

  async updateTrip({ tripId, currentUserId, data, transaction }: UpdateTripParams) {
    const queryExecutor = transaction ?? this.dbAgent;

    const query = knex('trips').where('id', tripId);

    if (data.name) query.update('name', data.name);

    if (data.startDate) query.update('startDate', data.startDate);

    if (data.endDate) query.update('endDate', data.endDate);

    if (data.fileId !== undefined) query.update('fileId', data.fileId);

    await queryExecutor.runQuery({
      query: query.toQuery(),
    });

    if (data.userIds) {
      await queryExecutor.runQuery({
        query: 'DELETE FROM user_trips WHERE tripId = ? AND userId != ?;',
        values: [tripId, currentUserId],
      });

      if (data.userIds.length) {
        const usersToAdd = data.userIds.map((id) => ({ tripId, userId: id }));
        await queryExecutor.runQuery({
          query: knex('user_trips').insert(usersToAdd).toQuery(),
        });
      }
    }

    if (data.countries) {
      if (!data.countries.length) {
        throw new Error('You need to have at least one country on a trip');
      }

      await queryExecutor.runQuery({
        query: 'DELETE FROM trip_countries WHERE tripId = ?;',
        values: [tripId],
      });

      const countryRows = data.countries.map((country) => {
        const cityIds = country.cityIds?.join(',') ?? null;
        return {
          tripId,
          countryId: country.countryId,
          cityIds,
        };
      });

      await queryExecutor.runQuery({
        query: knex('trip_countries').insert(countryRows).toQuery(),
      });
    }
  }
}

export default TripRepository__V2;

interface GetTripsFilters {
  userId?: number;
  tripIds?: number[];
  includeDeleted?: boolean;
}

export interface DBGetTripsResult extends mysql.RowDataPacket {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  filePath: string | null;
  totalExpenseAmount: number;
}

interface CreateTripParams {
  name: string;
  startDate: string;
  endDate: string;
  fileId?: number;
  countries: Array<{ countryId: number; cityIds?: number[] }>;
  userIds: number[];
}

interface UpdateTripParams {
  tripId: number;
  currentUserId: number;
  data: Partial<CreateTripParams>;
  transaction?: DBTransaction;
}
