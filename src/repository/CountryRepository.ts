import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';
import { DBGetCountriesByTripIDResult } from './CountryRepository.types';

class CountryRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async getCountriesForTrips(tripIds: number[]) {
    const results = await this.dbAgent.runQuery<DBGetCountriesByTripIDResult[]>({
      query: `
        SELECT c.id, c.name, tc.tripId, cur.code as currencyCode, cur.id as currencyId
        FROM trip_countries tc
        JOIN countries c on c.id = tc.countryId
        JOIN currencies cur on cur.id = c.currencyId
        WHERE tc.tripId = ?;
      `,
      values: [tripIds],
    });

    return results;
  }
}

export default CountryRepository;
