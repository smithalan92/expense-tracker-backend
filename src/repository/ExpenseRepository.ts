import { OkPacket } from 'mysql2';
import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';
import { DBExpenseResult, NewExpenseRecord } from './ExpenseRepository.types';

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
          te.userId,
          te.createdAt,
          te.updatedAt,
          us.id,
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
}

export default ExpenseRepository;
