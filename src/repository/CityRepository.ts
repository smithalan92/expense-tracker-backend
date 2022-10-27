import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';
import { DBCityResult } from './CityRepository.types';

class CityRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
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
