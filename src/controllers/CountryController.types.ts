import { DBCityResult } from '../repository/CityRepository.types';

export interface GetCitiesForCountriesParams {
  countryIds: number[];
}

export interface CitiesByCountryId {
  [key: number]: DBCityResult[];
}

export interface GetCitiesForCountriesResponse {
  countries: CitiesByCountryId;
}
