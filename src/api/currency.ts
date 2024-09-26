import axios from 'axios';
import { type GetCurrencyResponse } from './currency.types';

export async function getExchangeRatesForEUR() {
  const { data } = await axios.get<GetCurrencyResponse>('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json');

  return data;
}
