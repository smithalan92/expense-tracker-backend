import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';
import { DBGetCategoriesResult } from './CategoryRepository.types';

class CategoryRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async getCategories() {
    const results = await this.dbAgent.runQuery<DBGetCategoriesResult[]>({
      query: `
        SELECT id, name
        FROM expense_categories
        ORDER BY orderId ASC;
      `,
    });

    return results;
  }
}

export default CategoryRepository;
