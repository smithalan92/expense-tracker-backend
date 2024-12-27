import type mysql from 'mysql2';
import { ResultSetHeader } from 'mysql2';
import type DBAgent from '../lib/DBAgent';
import knex from '../lib/knex';

class ExpenseRepository__V2 {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async findExpensesForTrip(tripId: number, expenseIds?: number[]) {
    const results = await this.dbAgent.runQuery<DBExpenseResult[]>({
      query: `
        SELECT
          te.id,
          te.amount,
          te.currencyId,
          cu.code as currencyCode,
          cu.name as currencyName,
          te.euroAmount,
          te.localDateTime,
          te.description,
          te.categoryId,
          ca.name as categoryName,
          te.cityId,
          ci.name as cityName,
          ci.timezoneName as cityTimeZone,
          co.id as countryId,
          co.name as countryName,
          te.createdAt,
          te.updatedAt,
          us.id as userId,
          us.firstName,
          us.lastName
        FROM trip_expenses te
        JOIN expense_categories ec ON te.categoryId = ec.id
        JOIN currencies cu ON cu.id=te.currencyId
        JOIN expense_categories ca ON ca.id = te.categoryId
        JOIN cities ci ON ci.id = te.cityId
        JOIN countries co ON co.id = ci.countryId
        JOIN users us ON te.userId = us.id
        WHERE te.tripId = ?
        ${expenseIds?.length ? `AND te.id IN (${this.dbAgent.prepareArrayForInValue(expenseIds)})` : ''}
        ORDER BY localDateTime DESC;
      `,
      values: [tripId],
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

  async canUpdateExpense({ expenseId, userId }: { expenseId: number; userId: number }) {
    const [result] = await this.dbAgent.runQuery<DBExpenseForUpdate[]>({
      query: `
        SELECT e.id, e.tripId, e.amount, e.currencyId
        FROM trip_expenses e
        LEFT JOIN user_trips ut ON ut.tripId = e.tripId
        LEFT JOIN trips t on t.id = e.tripId
        WHERE e.id = ?
        AND ut.userId = ?
        AND t.status = 'active';
      `,
      values: [expenseId, userId],
    });

    return result;
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
