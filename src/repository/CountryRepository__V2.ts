import type { RowDataPacket } from 'mysql2';
import type DBAgent from '../lib/DBAgent';

class CountryRepository__V2 {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async getCountries() {
    const results = await this.dbAgent.runQuery<DBGetCountriesResult[]>({
      query: `
        SELECT co.id, co.name, cu.id as currencyId, cu.name as currencyName, cu.code as currencyCode
        FROM countries co
        JOIN currencies cu ON co.currencyId = cu.id
        ORDER BY name ASC;
      `,
    });

    return results.map<CountryWithCurrency>((result) => ({
      id: result.id,
      name: result.name,
      currency: {
        id: result.currencyId,
        name: result.currencyName,
        code: result.currencyCode,
      },
    }));
  }
}

export default CountryRepository__V2;

interface DBGetCountriesResult extends RowDataPacket {
  id: number;
  name: string;
  currencyId: number;
  currencyName: string;
  currencyCode: string;
}

export interface CountryWithCurrency {
  id: number;
  name: string;
  currency: {
    id: number;
    name: string;
    code: string;
  };
}
