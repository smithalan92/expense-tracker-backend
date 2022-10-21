import { DBCityResult } from '../repository/CityRepository.types';

export interface GetCitiesForCountryParams {
  countryId: number;
}

export interface GetCitiesForCountryResponse {
  cities: DBCityResult[];
}
