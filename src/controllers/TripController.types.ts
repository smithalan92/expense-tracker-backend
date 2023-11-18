import { type DBGetCategoriesResult } from '../repository/CategoryRepository.types';
import { type DBGetCityOptionsForTripIdResult } from '../repository/CityRepository.types';
import { type DBGetCountriesByTripIDResult } from '../repository/CountryRepository.types';
import { type DBGetCurrenciesResult } from '../repository/CurrencyRepository.types';
import {
  type DBExpenseByUserBreakdownForTripResult,
  type DBExpenseCategoryBreakdownForTripResult,
  type DBGetCityBreakdownResult,
  type DBGetCountryBreakdownResult,
  type DBGetDailyCostBreakdownResult,
  type DBGetExpensiveTripDayResult,
  type ExpenseCategoryBreakdownForTripByUser,
  type ParsedHourlyExpenseResult,
  type UpdateExpenseParams,
} from '../repository/ExpenseRepository.types';
import { type UsersForTrip } from '../repository/TripRepository.types';
import { type ProcessedTripExpense } from '../utils/expenseParser.types';

export interface ParsedTrip {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'deleted';
  image: string;
  totalLocalAmount: number;
  totalExpenseAmount: number;
}

export interface ResponseTrip extends ParsedTrip {
  countries: DBGetCountriesByTripIDResult[];
}

export interface GetTripReponse {
  trips: ResponseTrip[];
}

export interface RouteWithTripIDParams {
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
  userId: number;
}

export interface GetTripDataResponse {
  expenses: ProcessedTripExpense[];
  trip: ParsedTrip;
  countries: DBGetCountriesByTripIDResult[];
  cities: DBGetCityOptionsForTripIdResult[];
  currencies: DBGetCurrenciesResult[];
  categories: DBGetCategoriesResult[];
  users: UsersForTrip;
}

export interface GetExpenseStatsResponse {
  categoryBreakdown: DBExpenseCategoryBreakdownForTripResult[];
  categoryByUserBreakdown: ExpenseCategoryBreakdownForTripByUser;
  userBreakdown: DBExpenseByUserBreakdownForTripResult[];
  mostExpenseDay: DBGetExpensiveTripDayResult;
  leastExpensiveDay: DBGetExpensiveTripDayResult;
  countryBreakdown: DBGetCountryBreakdownResult[];
  cityBreakdown: DBGetCityBreakdownResult[];
  dailyCostBreakdown: DBGetDailyCostBreakdownResult[];
  hourlySpendingBreakdown: ParsedHourlyExpenseResult[];
}

export interface DeleteExpenseParams {
  tripId: number;
  expenseId: number;
}

export interface EditExpenseForTripParams {
  tripId: number;
  expenseId: number;
}

export type UpdateExpenseForTripBody = UpdateExpenseParams;

export interface CreateTripCountry {
  countryId: number;
  cityIds?: number[];
}

export interface CreateTripBody {
  name: string;
  startDate: string;
  endDate: string;
  file?: string;
  countries: CreateTripCountry[];
  userIds: number[];
}

export interface CreateTripResponse {
  trip: ParsedTrip;
}

export type UpdateTripBody = Partial<CreateTripBody>;

export type UpdateTripResponse = CreateTripResponse;

export interface DeleteTripParams {
  tripId: number;
}

export interface CountryWithCities {
  name: string;
  countryId: number;
  cityIds?: number[];
}

export interface GetTripDataForEditingResponse {
  image: string | null;
  name: string;
  startDate: string;
  endDate: string;
  countries: CountryWithCities[];
  userIds: number[];
}
