import { type DBCityResult } from '../repository/CityRepository.types';
import { type DBCountriesResult } from '../repository/CountryRepository.types';

export interface GetCountriesResponse {
  countries: DBCountriesResult[];
}

export interface GetCitiesForCountryParams {
  countryId: number;
}

export interface GetCitiesForCountryResponse {
  cities: DBCityResult[];
}
