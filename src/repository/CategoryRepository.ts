import type mysql from 'mysql2';
import type DBAgent from '../lib/DBAgent';

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

export interface DBGetCategoriesResult extends mysql.RowDataPacket {
  id: number;
  name: string;
}
