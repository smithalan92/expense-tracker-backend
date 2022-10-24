import { DBGetCountriesByTripIDResult } from '../repository/CountryRepository.types';
import { DBExpenseResult } from '../repository/ExpenseRepository.types';
import { DBTripResult } from '../repository/TripRepository.types';

export interface ResponseTrip extends DBTripResult {
  countries: DBGetCountriesByTripIDResult[];
}

export interface GetTripReponse {
  trips: ResponseTrip[];
}

export interface GetExpensesForTripReponse {
  trip: DBTripResult;
  expenses: DBExpenseResult[];
}

export interface GetExpensesForTripParams {
  tripId: number;
}

export interface GetCountriesForTripParams {
  tripId: number;
}

export interface GetCountriesForTripResponse {
  countries: DBGetCountriesByTripIDResult[];
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
