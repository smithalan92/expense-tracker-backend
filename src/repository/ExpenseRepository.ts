import { OkPacket } from 'mysql2';
import DBAgent from '../lib/DBAgent';
import knex from '../lib/knex';
import { ContainerCradle } from '../lib/types';
import { get12HourTimeFromHour } from '../utils/time';
import {
  DBExpenseByUserBreakdownForTripResult,
  DBExpenseCategoryBreakdownForTripByUserResult,
  DBExpenseCategoryBreakdownForTripResult,
  DBExpenseResult,
  DBGetCityBreakdownResult,
  DBGetCountryBreakdownResult,
  DBGetDailyCostBreakdownResult,
  DBGetExpensiveTripDayResult,
  DBGetSingleExpenseResult,
  DBHourlyExpenseBreakdownResult,
  ExpenseCategoryBreakdownForTripByUser,
  NewExpenseRecord,
  ParsedHourlyExpenseResult,
  UpdateExpenseParams,
} from './ExpenseRepository.types';

class ExpenseRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async findExpensesForTrip(tripId: number) {
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
        ORDER BY localDateTime DESC;
      `,
      values: [tripId],
    });

    return results;
  }

  async getExpense(expenseId: number, userId: number) {
    const [result] = await this.dbAgent.runQuery<DBGetSingleExpenseResult[]>({
      query: `
        SELECT te.*
        FROM trip_expenses te
        JOIN user_trips ut ON ut.tripId = te.tripId
        JOIN trips t ON t.id = te.tripId
        WHERE te.id = ?
        AND ut.userId = ?
        AND t.status = 'active';
      `,
      values: [expenseId, userId],
    });

    return result;
  }

  async addExpenseForTrip(expense: NewExpenseRecord) {
    const query = knex('trip_expenses')
      .insert({
        tripId: expense.tripId,
        amount: expense.amount,
        currencyId: expense.currencyId,
        euroAmount: expense.euroAmount,
        localDateTime: expense.localDateTime,
        description: expense.description,
        categoryId: expense.categoryId,
        cityId: expense.cityId,
        userId: expense.userId,
        createdByUserId: expense.createdByUserId,
      })
      .toQuery();

    const result = await this.dbAgent.runQuery<OkPacket>({
      query,
    });

    if (!result.insertId) {
      throw new Error('Failed to insert new expense');
    }
  }

  async updateExpenseForTrip(tripId: number, expenseId: number, userId: number, params: UpdateExpenseParams) {
    let query = knex('trip_expenses')
      .where('id', expenseId)
      .where('tripId', tripId)
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

    const result = await this.dbAgent.runQuery<OkPacket>({
      query: sql,
    });

    if (result.changedRows !== 1) {
      console.log(params);
      throw new Error('Failed to update expense');
    }
  }

  async deleteExpenseForTrip(tripId: number, expenseId: number) {
    return this.dbAgent.runQuery<OkPacket>({
      query: `
        DELETE FROM trip_expenses
        WHERE tripId = ?
        AND id = ?
      `,
      values: [tripId, expenseId],
    });
  }

  async getExpenseCategoryBreakdownForTrip(tripId: number) {
    const result = await this.dbAgent.runQuery<DBExpenseCategoryBreakdownForTripResult[]>({
      query: `
        SELECT ec.name as categoryName, ROUND(SUM(te.euroAmount), 2) as totalEuroAmount
        FROM trip_expenses te
        JOIN expense_categories ec ON ec.id = te.categoryId
        WHERE te.tripId = ?
        GROUP BY ec.id
        ORDER BY totalEuroAmount DESC;
      `,
      values: [tripId],
    });

    return result;
  }

  async getExpenseByUserBreakdownForTrip(tripId: number) {
    const result = await this.dbAgent.runQuery<DBExpenseByUserBreakdownForTripResult[]>({
      query: `
        SELECT u.firstName as userFirstName, ROUND(SUM(te.euroAmount), 2) as totalEuroAmount
        FROM trip_expenses te
        JOIN users u ON u.id = te.userId
        WHERE te.tripId = ?
        GROUP BY u.id
        ORDER BY totalEuroAmount DESC;
      `,
      values: [tripId],
    });

    return result;
  }

  async getMostExpensiveTripDay(tripId: number) {
    const result = await this.dbAgent.runQuery<DBGetExpensiveTripDayResult[]>({
      query: `
        SELECT DATE_FORMAT(localDateTime, '%Y-%m-%d') as localDate, ROUND(SUM(te.euroAmount), 2) as totalEuroAmount
        FROM trip_expenses te
        WHERE te.tripId = ?
        GROUP BY localDate
        ORDER BY totalEuroAmount DESC
        LIMIT 1;
      `,
      values: [tripId],
    });

    return result[0];
  }

  async getLeastExpensiveTripDay(tripId: number) {
    const result = await this.dbAgent.runQuery<DBGetExpensiveTripDayResult[]>({
      query: `
        SELECT DATE_FORMAT(localDateTime, '%Y-%m-%d') as localDate, ROUND(SUM(te.euroAmount), 2) as totalEuroAmount
        FROM trip_expenses te
        WHERE te.tripId = ?
        GROUP BY localDate
        ORDER BY totalEuroAmount ASC
        LIMIT 1;
      `,
      values: [tripId],
    });

    return result[0];
  }

  async getExpenseByCountryBreakdownForTrip(tripId: number) {
    const results = await this.dbAgent.runQuery<DBGetCountryBreakdownResult[]>({
      query: `
        SELECT co.name, TRUNCATE(SUM(te.euroAmount), 2) as euroTotal, TRUNCATE(SUM(te.amount), 2) as localTotal, cu.code as localCurrency
        FROM trip_expenses te
        LEFT JOIN cities c ON c.id = te.cityId
        LEFT JOIN countries co ON co.id = c.countryId
        LEFT JOIN currencies cu ON cu.id = te.currencyId
        WHERE te.tripId = ?
        GROUP BY co.id
        ORDER BY te.localDateTime;
      `,
      values: [tripId],
    });

    return results;
  }

  async getExpenseByCityBreakdownForTrip(tripId: number) {
    const results = await this.dbAgent.runQuery<DBGetCityBreakdownResult[]>({
      query: `
        SELECT c.name, TRUNCATE(SUM(te.euroAmount), 2) as euroTotal, TRUNCATE(SUM(te.amount), 2) as localAmount, cu.code as localCurrency
        FROM trip_expenses te
        LEFT JOIN cities c ON c.id = te.cityId
        LEFT JOIN countries co ON co.id = c.countryId
        LEFT JOIN currencies cu ON cu.id = te.currencyId
        WHERE te.tripId = ?
        GROUP BY c.id
        ORDER BY te.localDateTime
      `,
      values: [tripId],
    });

    return results;
  }

  async getDailyCostBreakdownForTrip(tripId: number) {
    const results = await this.dbAgent.runQuery<DBGetDailyCostBreakdownResult[]>({
      query: `
        SELECT  DATE_FORMAT(localDateTime, '%Y-%m-%d') as localDate, TRUNCATE(SUM(te.euroAmount), 2) as euroTotal
        FROM trip_expenses te
        WHERE te.tripId = ?
        GROUP BY YEAR(te.localDateTime), MONTH(te.localDateTime), DAY(te.localDateTime)
        ORDER BY localDate ASC;
      `,
      values: [tripId],
    });

    return results;
  }

  async getExpenseCategoryBreakdownByUser(tripId: number) {
    const results = await this.dbAgent.runQuery<DBExpenseCategoryBreakdownForTripByUserResult[]>({
      query: `
      SELECT ec.name as categoryName, ROUND(SUM(te.euroAmount), 2) as totalEuroAmount, te.userId
      FROM trip_expenses te
      JOIN expense_categories ec ON ec.id = te.categoryId
      WHERE te.tripId = ?
      GROUP BY ec.id, te.userId
      ORDER BY userId, totalEuroAmount DESC
    `,
      values: [tripId],
    });

    return results.reduce<ExpenseCategoryBreakdownForTripByUser>((acc, current) => {
      if (acc[current.userId]) {
        acc[current.userId].push({
          categoryName: current.categoryName,
          totalEuroAmount: current.totalEuroAmount,
        });
      } else {
        acc[current.userId] = [
          {
            categoryName: current.categoryName,
            totalEuroAmount: current.totalEuroAmount,
          },
        ];
      }
      return acc;
    }, {});
  }

  async getHourlySpendingBreakdown(tripId: number) {
    const results = await this.dbAgent.runQuery<DBHourlyExpenseBreakdownResult[]>({
      query: `
        SELECT HOUR(localDateTime) as hour, ROUND(SUM(euroAmount), 2) as total
        from trip_expenses
        WHERE tripId = ?
        GROUP BY HOUR(localDateTime)
        ORDER BY hour ASC
      `,
      values: [tripId],
    });

    const parsedResults: ParsedHourlyExpenseResult[] = [];

    for (let i = 0; i < 24; i++) {
      const { total } = results.find(({ hour }) => hour === i) ?? {};
      const hour = get12HourTimeFromHour(i);

      if (total) parsedResults[i] = { hour, total };
      else parsedResults[i] = { hour, total: 0 };
    }

    return parsedResults;
  }
}
export default ExpenseRepository;
