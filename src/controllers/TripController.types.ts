import { DBGetCountriesByTripIDResult } from '../repository/CountryRepository.types';
import { DBTripResult } from '../repository/TripRepository.types';

export interface ResponseTrip extends DBTripResult {
  countries: DBGetCountriesByTripIDResult[];
}

export interface GetTripReponse {
  trips: ResponseTrip[];
}

export interface ExpenseCurrency {
  id: number;
  code: string;
  name: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
}

export interface ExpenseCity {
  id: number;
  name: string;
  timezone: string;
}

export interface ExpenseCountry {
  id: number;
  name: string;
}

export interface ProcessedTripExpense {
  id: number;
  amount: string;
  currency: ExpenseCurrency;
  euroAmount: string;
  localDateTime: string;
  description: string;
  category: ExpenseCategory;
  city: ExpenseCity;
  country: ExpenseCountry;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetExpensesForTripReponse {
  trip: DBTripResult;
  expenses: ProcessedTripExpense[];
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
