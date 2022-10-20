import { DBGetCountriesByIDResult } from '../repository/CountryRepository.types';
import { DBExpenseResult } from '../repository/ExpenseRepository.types';
import { DBTripResult } from '../repository/TripRepository.types';

export interface ResponseTrip extends DBTripResult {
  countries: DBGetCountriesByIDResult[];
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
