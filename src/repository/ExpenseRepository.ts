import type mysql from 'mysql2';
import { ResultSetHeader } from 'mysql2';
import type DBAgent from '../lib/DBAgent';
import knex from '../lib/knex';

class ExpenseRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async findExpensesForTrip({ tripId, expenseIds }: { tripId?: number; expenseIds?: number[] }) {
    if (!tripId && !expenseIds?.length) throw new Error('Invalid args');

    const usersSubquery = knex('trip_expense_users as teu')
      .select('teu.tripExpenseId')
      .select(
        knex.raw(
          'JSON_ARRAYAGG(JSON_OBJECT(' +
            '"id", u.id,' +
            '"firstName", u.firstName,' +
            '"lastName", u.lastName' +
            ')) as users',
        ),
      )
      .leftJoin({ u: 'users' }, 'u.id', 'teu.userId')
      .groupBy('teu.tripExpenseId')
      .as('teu_agg');

    const query = knex
      .select(
        'te.id',
        'te.amount',
        'te.currencyId',
        'cu.code as currencyCode',
        'cu.name as currencyName',
        'te.euroAmount',
        'te.localDateTime',
        'te.description',
        'te.categoryId',
        'ec.name as categoryName',
        'te.cityId',
        'ci.name as cityName',
        'ci.timezoneName as cityTimeZone',
        'co.id as countryId',
        'co.name as countryName',
        'te.createdAt',
        'te.updatedAt',
        'teu_agg.users as users',
        'te.tripId as tripId',
      )
      .from({ te: 'trip_expenses' })
      .leftJoin({ ec: 'expense_categories' }, 'ec.id', 'te.categoryId')
      .leftJoin({ cu: 'currencies' }, 'cu.id', 'te.currencyId')
      .leftJoin({ ci: 'cities' }, 'ci.id', 'te.cityId')
      .leftJoin({ co: 'countries' }, 'co.id', 'ci.countryId')
      // join the aggregated users-per-expense subquery
      .leftJoin(usersSubquery, 'te.id', 'teu_agg.tripExpenseId')
      .orderBy('te.localDateTime', 'desc');

    if (tripId) {
      query.where('te.tripId', tripId);
    }

    if (expenseIds) {
      query.whereIn('te.id', expenseIds);
    }

    const results = await this.dbAgent.runQuery<DBExpenseResult[]>({
      query: query.toQuery(),
    });

    return results;
  }

  async addExpensesForTrip(expenses: NewExpenseRecord[]) {
    const transaction = await this.dbAgent.createTransaction();
    const expenseIds: number[] = [];

    try {
      await transaction.begin();

      for (const expense of expenses) {
        const { userIds, ...expenseRow } = expense;

        // Optional: enforce at least one user per expense
        if (!userIds || userIds.length === 0) {
          throw new Error('Each expense must have at least one userId');
        }

        const query = knex('trip_expenses').insert(expenseRow).toQuery();
        const result = await transaction.runQuery<ResultSetHeader>({ query });

        if (!result.insertId) {
          throw new Error('Failed to insert');
        }

        expenseIds.push(result.insertId);

        const expenseUsers = userIds.map<ExpenseUserRecord>((userId) => ({
          tripExpenseId: result.insertId,
          userId,
        }));

        const expenseUsersQuery = knex('trip_expense_users').insert(expenseUsers).toQuery();

        await transaction.runQuery<ResultSetHeader>({ query: expenseUsersQuery });
      }
      await transaction.commit();

      return expenseIds;
    } catch (err: any) {
      if (transaction?.hasStarted) {
        await transaction.rollback();
      }
      throw err;
    }
  }

  async updateExpenseForTrip({
    expenseId,
    userId,
    params,
  }: {
    expenseId: number;
    userId: number;
    params: UpdatedExpenseParams;
  }) {
    let query = knex('trip_expenses')
      .where('id', expenseId)
      .update('updatedByUserId', userId)
      .update('updatedAt', knex.raw('NOW()'));

    if (params.amount) query = query.update('amount', params.amount);
    if (params.euroAmount) query = query.update('euroAmount', params.euroAmount);
    if (params.currencyId) query = query.update('currencyId', params.currencyId);
    if (params.localDateTime) query = query.update('localDateTime', params.localDateTime);
    if (params.description) query = query.update('description', params.description);
    if (params.categoryId) query = query.update('categoryId', params.categoryId);
    if (params.cityId) query = query.update('cityId', params.cityId);

    const sql = query.toQuery();

    const transaction = await this.dbAgent.createTransaction();

    try {
      await transaction.begin();
      const result = await this.dbAgent.runQuery<ResultSetHeader>({
        query: sql,
      });

      if (result.affectedRows !== 1) {
        throw new Error('Failed to update expense');
      }

      if (params.userIds) {
        await transaction.runQuery<ResultSetHeader>({
          query: knex('trip_expense_users').where('tripExpenseId', expenseId).delete().toQuery(),
        });

        const joinRows = params.userIds.map<ExpenseUserRecord>((uid) => ({
          tripExpenseId: expenseId,
          userId: uid,
        }));

        await transaction.runQuery<ResultSetHeader>({ query: knex('trip_expense_users').insert(joinRows).toQuery() });
      }

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  async deleteExpense(expenseId: number) {
    const result = await this.dbAgent.runQuery<ResultSetHeader>({
      query: `
        DELETE FROM trip_expenses
        WHERE id = ?
      `,
      values: [expenseId],
    });

    if (result.affectedRows !== 1) {
      throw new Error('Failed to delete expense');
    }
  }

  async getTotalExpenesForTripByUsers(tripId: number) {
    const results = await this.dbAgent.runQuery<DBTotalExpensesForTripByUserResult[]>({
      query: `
        SELECT
          u.id AS userId,
          u.firstName,
          u.lastName,
          ROUND(SUM(te.euroAmount / uc.userCount), 2) AS totalEuroAmount
        FROM trip_expense_users AS teu
        JOIN trip_expenses AS te
          ON te.id = teu.tripExpenseId
        JOIN users AS u
          ON u.id = teu.userId
        JOIN (
          SELECT
            tripExpenseId,
            COUNT(*) AS userCount
          FROM trip_expense_users
          GROUP BY tripExpenseId
        ) AS uc
          ON uc.tripExpenseId = teu.tripExpenseId
        WHERE te.tripId = ?
        GROUP BY
          u.id,
          u.firstName,
          u.lastName
        ORDER BY
          totalEuroAmount DESC;
      `,
      values: [tripId],
    });

    return results;
  }

  async getTotalExpenesByCategoryAndUserForTrip(tripId: number) {
    // Subquery: how many users per expense
    const userCountSubquery = knex('trip_expense_users as teu2')
      .select('teu2.tripExpenseId')
      .count<{ userCount: number }>('* as userCount')
      .groupBy('teu2.tripExpenseId')
      .as('uc');

    const query = knex
      .select(
        'u.id as userId',
        'u.firstName',
        'u.lastName',
        'ec.id as categoryId',
        'ec.name as categoryName',
        knex.raw('ROUND(SUM(te.euroAmount / uc.userCount), 2) as totalEuroAmount'),
      )
      .from({ teu: 'trip_expense_users' })
      .join({ te: 'trip_expenses' }, 'te.id', 'teu.tripExpenseId')
      .join({ u: 'users' }, 'u.id', 'teu.userId')
      .join({ ec: 'expense_categories' }, 'ec.id', 'te.categoryId')
      .join(userCountSubquery, 'uc.tripExpenseId', 'teu.tripExpenseId')
      .where('te.tripId', tripId)
      .groupBy('u.id', 'u.firstName', 'u.lastName', 'ec.id', 'ec.name')
      .orderBy('u.id')
      .orderBy('totalEuroAmount', 'desc');

    // however you normally run queries:
    const sql = query.toQuery();
    const results = await this.dbAgent.runQuery<DBExpensesByCategoryAndUserResult[]>({ query: sql });

    return results;
  }
}

export default ExpenseRepository;

export interface DBExpenseUser {
  id: number;
  firstName: string;
  lastName: string;
}

export interface DBExpenseResult extends mysql.RowDataPacket {
  id: number;
  amount: number;
  currencyId: number;
  currencyCode: string;
  currencyName: string;
  euroAmount: number;
  localDateTime: Date;
  description: string;
  categoryId: number;
  categoryName: string;
  cityId: number;
  cityName: string;
  cityTimeZone: string;
  countryId: number;
  countryName: string;
  createdAt: Date;
  updatedAt: Date;
  users: DBExpenseUser[];
  tripId: number;
}

export interface NewExpenseRecord {
  tripId: number;
  amount: number;
  currencyId: number;
  euroAmount: number;
  localDateTime: string;
  description: string;
  categoryId: number;
  cityId: number;
  userIds: number[];
  createdByUserId: number;
}

interface ExpenseUserRecord {
  tripExpenseId: number;
  userId: number;
}

export interface DBExpenseForUpdate extends mysql.RowDataPacket {
  id: number;
  tripId: number;
  amount: number;
  currencyId: number;
}

export interface UpdatedExpenseParams {
  amount?: number;
  currencyId?: number;
  euroAmount?: number;
  localDateTime?: string;
  description?: string;
  categoryId?: number;
  cityId?: number;
  userIds?: number[];
}

export interface DBTotalExpensesForTripByUserResult extends mysql.RowDataPacket {
  userId: number;
  firstName: string;
  lastName: string;
  totalEuroAmount: number;
}

export interface DBExpensesByCategoryAndUserResult extends mysql.RowDataPacket {
  userId: number;
  firstName: string | null;
  lastName: string | null;
  categoryId: number;
  totalEuroAmount: number;
}
