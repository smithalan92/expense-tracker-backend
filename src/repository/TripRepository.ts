import type mysql from 'mysql2';
import { ResultSetHeader } from 'mysql2';
import type DBAgent from '../lib/DBAgent';
import DBTransaction from '../lib/DBTransaction';
import knex from '../lib/knex';

class TripRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async getTrips({
    userId,
    tripIds,
    includeDeleted,
    includeCountries,
    includeUsers,
    includeExpenseCount,
  }: GetTripsFilters) {
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

    if (includeCountries) {
      query.column(
        knex.raw(
          `(SELECT JSON_ARRAYAGG(JSON_OBJECT('id', c.id, 'name', c.name, 'code', c.iso2)) FROM trip_countries tc JOIN countries c ON c.id = tc.countryId WHERE tc.tripId = t.id) as countries`,
        ),
      );
    }

    if (includeUsers) {
      query.column(
        knex.raw(
          `(SELECT JSON_ARRAYAGG(JSON_OBJECT('id', u.id, 'name', CONCAT(u.firstName, ' ', u.lastName))) FROM user_trips ut2 JOIN users u ON u.id = ut2.userId WHERE ut2.tripId = t.id) as users`,
        ),
      );
    }

    if (includeExpenseCount) {
      query.column(knex.raw('(SELECT COUNT(*) FROM trip_expenses te2 WHERE te2.tripId = t.id) as expenseCount'));
    }

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

    const countryInserts = countries.map((current) => ({
      tripId,
      countryId: current.countryId,
    }));

    const cityInserts = countries.flatMap((current) => (current.cityIds ?? []).map((cityId) => ({ tripId, cityId })));

    const userInserts = Array.from(new Set(userIds)).map((current) => ({
      tripId,
      userId: current,
    }));

    const insertPromises: Promise<unknown>[] = [
      transaction.runQuery({
        query: knex('trip_countries').insert(countryInserts).toQuery(),
      }),
      transaction.runQuery({
        query: knex('user_trips').insert(userInserts).toQuery(),
      }),
    ];

    if (cityInserts.length) {
      insertPromises.push(
        transaction.runQuery({
          query: knex('trip_cities').insert(cityInserts).toQuery(),
        }),
      );
    }

    await Promise.all(insertPromises);

    return tripId;
  }

  async updateTrip({ tripId, currentUserId, data, transaction }: UpdateTripParams) {
    const queryExecutor = transaction ?? this.dbAgent;

    const { name, startDate, endDate, fileId, countries, userIds, status } = data;

    const query = knex('trips').where('id', tripId).update('updatedAt', knex.raw('NOW()'));

    if (name) query.update('name', name);

    if (startDate) query.update('startDate', startDate);

    if (endDate) query.update('endDate', endDate);

    if (fileId !== undefined) query.update('fileId', fileId);

    if (status) query.update('status', status);

    await queryExecutor.runQuery({
      query: query.toQuery(),
    });

    if (userIds) {
      await queryExecutor.runQuery({
        query: 'DELETE FROM user_trips WHERE tripId = ? AND userId != ?;',
        values: [tripId, currentUserId],
      });

      const userIdsWithoutCurrentUser = Array.from(new Set(userIds)).filter((id) => id !== currentUserId);

      if (userIdsWithoutCurrentUser.length) {
        const usersToAdd = userIdsWithoutCurrentUser.map((id) => ({ tripId, userId: id }));
        await queryExecutor.runQuery({
          query: knex('user_trips').insert(usersToAdd).toQuery(),
        });
      }
    }

    if (countries) {
      if (!countries.length) {
        throw new Error('You need to have at least one country on a trip');
      }

      await queryExecutor.runQuery({
        query: 'DELETE FROM trip_countries WHERE tripId = ?;',
        values: [tripId],
      });

      await queryExecutor.runQuery({
        query: 'DELETE FROM trip_cities WHERE tripId = ?;',
        values: [tripId],
      });

      const countryRows = countries.map((country) => ({
        tripId,
        countryId: country.countryId,
      }));

      const cityRows = countries.flatMap((country) => (country.cityIds ?? []).map((cityId) => ({ tripId, cityId })));

      const updatePromises: Promise<unknown>[] = [
        queryExecutor.runQuery({
          query: knex('trip_countries').insert(countryRows).toQuery(),
        }),
      ];

      if (cityRows.length) {
        updatePromises.push(
          queryExecutor.runQuery({
            query: knex('trip_cities').insert(cityRows).toQuery(),
          }),
        );
      }

      await Promise.all(updatePromises);
    }
  }
}

export default TripRepository;

interface GetTripsFilters {
  userId?: number;
  tripIds?: number[];
  includeDeleted?: boolean;
  includeCountries?: boolean;
  includeUsers?: boolean;
  includeExpenseCount?: boolean;
}

export interface DBGetTripsResult extends mysql.RowDataPacket {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  filePath: string | null;
  totalExpenseAmount: number;
  countries?: Array<{ id: number; name: string; code: string }>;
  users?: Array<{ id: number; name: string }>;
  expenseCount?: number;
}

interface CreateTripParams {
  name: string;
  startDate: string;
  endDate: string;
  fileId?: number;
  countries: Array<{ countryId: number; cityIds?: number[] }>;
  userIds: number[];
  status?: 'active' | 'deleted';
}

interface UpdateTripParams {
  tripId: number;
  currentUserId: number;
  data: Partial<CreateTripParams>;
  transaction?: DBTransaction;
}
