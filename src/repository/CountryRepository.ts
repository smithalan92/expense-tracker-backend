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
    const query = knex
      .select('ci.id as cityId', 'ci.name as cityName', 'c.id as id', 'c.currencyId as currencyId', 'c.name as name')
      .from({ tc: 'trip_countries' })
      .leftJoin({ c: 'countries' }, 'c.id', 'tc.countryId')
      .leftJoin({ ci: 'cities' }, knex.raw('FIND_IN_SET(ci.id, tc.cityIds)'))
      .where('tc.tripId', tripId)
      .orderBy('ci.name', 'asc');

    const results = await this.dbAgent.runQuery<DBCountryWithCity[]>({
      query: query.toQuery(),
    });

    const countries = results.reduce<TripCountryWithCities[]>((acc, current) => {
      const { cityId, cityName, id, name, currencyId } = current;

      const existingCountry = acc.find((c) => c.id === id);

      if (!existingCountry) {
        const newCountry: TripCountryWithCities = { id, name, currencyId, cities: [] };
        if (cityId) newCountry.cities.push({ id: cityId, name: cityName! });
        acc.push(newCountry);
      } else {
        if (cityId) existingCountry.cities.push({ id: cityId, name: cityName! });
      }

      return acc;
    }, []);

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

interface DBCountryWithCity extends RowDataPacket {
  cityId: Nullable<number>;
  cityName: Nullable<string>;
  id: number;
  name: string;
}

export interface TripCountryWithCities {
  id: number;
  name: string;
  currencyId: number;
  cities: Array<{ id: number; name: string }>;
}
