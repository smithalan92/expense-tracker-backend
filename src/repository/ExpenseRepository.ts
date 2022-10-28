import { OkPacket } from 'mysql2';
import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';
import {
  DBExpenseByUserBreakdownForTripResult,
  DBExpenseCategoryBreakdownForTripResult,
  DBExpenseResult,
  DBGetExpensiveTripDayResult,
  NewExpenseRecord,
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
          us.firstName
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

  async addExpenseForTrip(expense: NewExpenseRecord) {
    const result = await this.dbAgent.runQuery<OkPacket>({
      query: `
        INSERT INTO trip_expenses (tripId, amount, currencyId, euroAmount, localDateTime, description, categoryId, cityId, userId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      values: [
        expense.tripId,
        expense.amount,
        expense.currencyId,
        expense.euroAmount,
        expense.localDateTime,
        expense.description,
        expense.categoryId,
        expense.cityId,
        expense.userId,
      ],
    });

    if (!result.insertId) {
      throw new Error('Failed to insert new expense');
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
}

export default ExpenseRepository;
