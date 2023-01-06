import { DBCountriesResult } from '../repository/CountryRepository.types';

export interface GetCountriesResponse {
  countries: DBCountriesResult[];
}
