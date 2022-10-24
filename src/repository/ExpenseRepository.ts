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
        SELECT te.id,te.amount,te.euroAmount,te.localDateTime as date,te.description,ec.name as categoryName,cu.code as currencyCode
        FROM trip_expenses te
        JOIN expense_categories ec ON te.categoryId = ec.id
        JOIN currencies cu ON cu.id=te.currencyId
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
