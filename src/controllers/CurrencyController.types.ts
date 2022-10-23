import { DBGetCurrenciesResult } from '../repository/CurrencyRepository.types';

export interface GetCurrenciesResponse {
  currencies: DBGetCurrenciesResult[];
}
