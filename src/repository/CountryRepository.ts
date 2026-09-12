import type { RowDataPacket } from 'mysql2';
import type DBAgent from '../lib/DBAgent';
import knex from '../lib/knex';

class CountryRepository {
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

  async getCitiesForCountries(countryIds: number[]) {
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

  async getSelectedCountriesAndCitiesForTrip(tripId: number) {
    const countriesQuery = knex
      .select('c.id', 'c.name', 'c.currencyId', 'c.iso2 as code')
      .from({ tc: 'trip_countries' })
      .join({ c: 'countries' }, 'c.id', 'tc.countryId')
      .where('tc.tripId', tripId)
      .orderBy('c.name', 'asc');

    const citiesQuery = knex
      .select('ci.id', 'ci.name', 'ci.countryId')
      .from({ tcity: 'trip_cities' })
      .join({ ci: 'cities' }, 'ci.id', 'tcity.cityId')
      .where('tcity.tripId', tripId)
      .orderBy('ci.name', 'asc');

    const [countryResults, cityResults] = await Promise.all([
      this.dbAgent.runQuery<DBCountryResult[]>({ query: countriesQuery.toQuery() }),
      this.dbAgent.runQuery<DBCityResult[]>({ query: citiesQuery.toQuery() }),
    ]);

    const countries: TripCountryWithCities[] = countryResults.map((c) => ({
      id: c.id,
      name: c.name,
      currencyId: c.currencyId,
      code: c.code,
      cities: [],
    }));

    cityResults.forEach((city) => {
      const country = countries.find((c) => c.id === city.countryId);
      if (country) {
        country.cities.push({ id: city.id, name: city.name });
      }
    });

    const countriesToGetAllCitiesFor = countries.reduce<number[]>((acc, country) => {
      if (country.cities.length === 0) acc.push(country.id);
      return acc;
    }, []);

    if (!countriesToGetAllCitiesFor.length) return countries;

    const missingCities = await this.getCitiesForCountries(countriesToGetAllCitiesFor);

    missingCities.forEach((city) => {
      const country = countries.find((c) => c.id === city.countryId);
      country!.cities.push({ id: city.id, name: city.name });
    });

    return countries;
  }
}

export default CountryRepository;

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

export interface DBCityResult extends RowDataPacket {
  id: number;
  name: string;
  countryId: number;
}

export interface DBCountryResult extends RowDataPacket {
  id: number;
  name: string;
  currencyId: number;
  code: string;
}

export interface TripCountryWithCities {
  id: number;
  name: string;
  currencyId: number;
  cities: Array<{ id: number; name: string }>;
  code: string;
}
