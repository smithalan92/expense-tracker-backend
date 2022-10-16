import axios from 'axios';
import { GetCurrencyResponse } from './currency.types';

export async function getExchangeRatesForEUR() {
  const { data } = await axios.get<GetCurrencyResponse>(`https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/eur.json`);

  return data;
}
