import type DBAgent from '../lib/DBAgent';
import { type ContainerCradle } from '../lib/types';
import { type DBCountriesResult, type DBGetCountriesByTripIDResult } from './CountryRepository.types';

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
