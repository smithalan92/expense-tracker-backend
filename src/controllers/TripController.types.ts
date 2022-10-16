import { DBExpenseResult } from '../repository/ExpenseRepository.types';
import { DBTripResult } from '../repository/TripRepository.types';

export interface GetTripReponse {
  trips: DBTripResult[];
}

export interface GetExpensesForTripReponse {
  trip: DBTripResult;
  expenses: DBExpenseResult[];
}

export interface GetExpensesForTripParams {
  tripId: number;
}
