import DBAgent from '../lib/DBAgent';
import { ContainerCradle } from '../lib/types';
import { DBCityResult } from './CityRepository.types';

class CityRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async getCitiesForCountry(countryId: number) {
    const results = await this.dbAgent.runQuery<DBCityResult[]>({
      query: `
        SELECT id, name
        FROM cities
        WHERE countryId = ?
        ORDER BY name ASC;
      `,
      values: [countryId],
    });

    return results;
  }
}

export default CityRepository;
