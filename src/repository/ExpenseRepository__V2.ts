import type mysql from 'mysql2';
import { ResultSetHeader } from 'mysql2';
import type DBAgent from '../lib/DBAgent';
import knex from '../lib/knex';

class ExpenseRepository__V2 {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async findExpensesForTrip({
    tripId,
    expenseIds,
    userId,
  }: {
    tripId?: number;
    expenseIds?: number[];
    userId?: number;
  }) {
    if (!tripId && (!expenseIds || !expenseIds.length)) throw new Error('Invalid args');

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
        'u.id as userId',
        'u.firstName',
        'u.lastName',
      )
      .from({ te: 'trip_expenses' })
      .leftJoin({ ec: 'expense_categories' }, 'ec.id', 'te.categoryId')
      .leftJoin({ cu: 'currencies' }, 'cu.id', 'te.currencyId')
      .leftJoin({ ci: 'cities' }, 'ci.id', 'te.cityId')
      .leftJoin({ co: 'countries' }, 'co.id', 'ci.countryId')
      .leftJoin({ u: 'users' }, 'u.id', 'te.userId')
      .orderBy('localDateTime', 'desc');

    if (tripId) {
      query.where('te.tripId', tripId);
    }

    if (expenseIds) {
      query.whereIn('te.id', expenseIds);
    }

    if (userId) {
      query.where('te.userId', userId);
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
        const query = knex('trip_expenses').insert(expense).toQuery();
        const result = await transaction.runQuery<ResultSetHeader>({ query });

        if (!result.insertId) {
          throw new Error('Failed to insert');
        } else {
          expenseIds.push(result.insertId);
        }
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
    if (params.userId) query = query.update('userId', params.userId);

    const sql = query.toQuery();

    const result = await this.dbAgent.runQuery<ResultSetHeader>({
      query: sql,
    });

    if (result.affectedRows !== 1) {
      throw new Error('Failed to update expense');
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
}

export default ExpenseRepository__V2;

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
  userId: number;
  firstName: string;
  lastName: string;
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
  userId: number;
  createdByUserId: number;
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
  userId?: number;
}
