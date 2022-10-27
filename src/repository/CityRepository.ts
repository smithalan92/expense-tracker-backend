import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';
import { DBCityResult, DBGetCityOptionsForTripIdResult } from './CityRepository.types';

class CityRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async getCityOptionsForTripId(tripId: number) {
    const results = await this.dbAgent.runQuery<DBGetCityOptionsForTripIdResult[]>({
      query: `
        SELECT c.id, c.name, c.timezoneName, c.countryId
        FROM trip_countries tc
        JOIN cities c ON tc.countryId = c.countryId
        WHERE tc.tripId = ?
        ORDER BY c.name ASC;
      `,
      values: [tripId],
    });

    return results;
  }

  async getCitiesForCountryIds(countryIds: number[]) {
    const results = await this.dbAgent.runQuery<DBCityResult[]>({
      query: `
        SELECT id, name, countryId
        FROM cities
        WHERE countryId IN (${this.dbAgent.prepareArrayForInValue(countryIds)})
        ORDER BY name ASC;
      `,
    });

    return results;
  }
}

export default CityRepository;
