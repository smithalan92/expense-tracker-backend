import type DBAgent from '../lib/DBAgent';
import { type ContainerCradle } from '../lib/types';
import { type DBCityResult, type DBGetCityOptionsForTripIdCountry, type DBGetCityOptionsForTripIdResult } from './CityRepository.types';

class CityRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async getCityOptionsForTripId(tripId: number) {
    const tripCountries = await this.dbAgent.runQuery<DBGetCityOptionsForTripIdCountry[]>({
      query: `
        SELECT countryId, cityIds
        FROM trip_countries tc
        WHERE tc.tripId = ?
      `,
      values: [tripId],
    });

    const allCitiesForCountryIds = tripCountries.filter((c) => !c.cityIds).map((c) => c.countryId);
    const cityIds = tripCountries.reduce<number[]>((acc, current) => {
      if (current.cityIds) {
        return [...acc, ...current.cityIds.split(',').map((s) => parseInt(s, 10))];
      }
      return acc;
    }, []);

    const results = await this.dbAgent.runQuery<DBGetCityOptionsForTripIdResult[]>({
      query: `
        SELECT c.id, c.name, c.timezoneName, c.countryId
        FROM cities c
        WHERE c.id IN (${this.dbAgent.prepareArrayForInValue(cityIds)})
        OR c.countryId IN (${this.dbAgent.prepareArrayForInValue(allCitiesForCountryIds)})
        ORDER BY c.name ASC;
      `,
    });

    return results;
  }

  async getCitiesById(cityIds: number[]) {
    return this.dbAgent.runQuery<DBCityResult[]>({
      query: `
        SELECT id, name, countryId
        FROM cities
        WHERE id IN (${this.dbAgent.prepareArrayForInValue(cityIds)})
        ORDER BY name ASC;
      `,
    });
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
