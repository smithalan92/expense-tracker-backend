import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';
import { DBExpenseResult } from './ExpenseRepository.types';

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
        WHERE te.tripId = ?;
      `,
      values: [tripId],
    });

    return results;
  }
}

export default ExpenseRepository;
