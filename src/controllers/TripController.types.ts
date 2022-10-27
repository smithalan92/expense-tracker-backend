import { DBGetCategoriesResult } from '../repository/CategoryRepository.types';
import { DBGetCityOptionsForTripIdResult } from '../repository/CityRepository.types';
import { DBGetCountriesByTripIDResult } from '../repository/CountryRepository.types';
import { DBGetCurrenciesResult } from '../repository/CurrencyRepository.types';
import { DBTripResult } from '../repository/TripRepository.types';
import { ProcessedTripExpense } from '../utils/expenseParser.types';

export interface ResponseTrip extends DBTripResult {
  countries: DBGetCountriesByTripIDResult[];
}

export interface GetTripReponse {
  trips: ResponseTrip[];
}

export interface GetExpensesForTripParams {
  tripId: number;
}

export interface GetExpensesForTripReponse {
  expenses: ProcessedTripExpense[];
}

export interface AddExpenseForTripParams {
  tripId: number;
}

export interface AddExpenseForTripBody {
  localDateTime: string;
  cityId: number;
  amount: number;
  currencyId: number;
  categoryId: number;
  description: string;
}

export interface GetTripDataResponse {
  expenses: ProcessedTripExpense[];
  trip: DBTripResult;
  countries: DBGetCountriesByTripIDResult[];
  cities: DBGetCityOptionsForTripIdResult[];
  currencies: DBGetCurrenciesResult[];
  categories: DBGetCategoriesResult[];
}
