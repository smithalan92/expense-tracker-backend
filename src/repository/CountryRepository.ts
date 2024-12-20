import type { RowDataPacket } from 'mysql2';
import type DBAgent from '../lib/DBAgent';

class CountryRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async getCountries() {
    const results = await this.dbAgent.runQuery<DBCountriesResult[]>({
      query: `
        SELECT id, name
        FROM countries
        ORDER BY name ASC;
      `,
    });

    return results;
  }

  async getCountries__V2() {
    const results = await this.dbAgent.runQuery<DBGetCountriesResult__V2[]>({
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

  async getCountriesForTrips(tripIds: number[]) {
    const results = await this.dbAgent.runQuery<DBGetCountriesByTripIDResult[]>({
      query: `
        SELECT c.id, c.name, tc.tripId, cur.code as currencyCode, cur.id as currencyId, tc.cityIds
        FROM trip_countries tc
        JOIN countries c on c.id = tc.countryId
        JOIN currencies cur on cur.id = c.currencyId
        WHERE tc.tripId IN (${this.dbAgent.prepareArrayForInValue(tripIds)});
      `,
    });

    return results;
  }
}

export default CountryRepository;

export interface DBCountriesResult extends RowDataPacket {
  id: number;
  name: string;
}

export interface DBGetCountriesByTripIDResult extends RowDataPacket {
  id: number;
  name: string;
  tripId: number;
  currencyCode: string;
  currencyId: number;
  cityIds: string | null;
}

interface DBGetCountriesResult__V2 extends RowDataPacket {
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
