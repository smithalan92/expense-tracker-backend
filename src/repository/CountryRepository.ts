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
        SELECT c.id, c.name, tc.tripId
        FROM trip_countries tc
        LEFT JOIN countries c on c.id = tc.countryId
        WHERE tc.tripId = ?;
      `,
      values: [tripIds],
    });

    return results;
  }
}

export default CountryRepository;
