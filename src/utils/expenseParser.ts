import { ProcessedTripExpense } from './expenseParser.types';
import { DBExpenseResult } from '../repository/ExpenseRepository.types';

export function parseExpenseForResponse(expense: DBExpenseResult): ProcessedTripExpense {
  return {
    id: expense.id,
    amount: expense.amount.toFixed(2),
    currency: {
      id: expense.currencyId,
      code: expense.currencyCode,
      name: expense.currencyName,
    },
    euroAmount: expense.euroAmount.toFixed(2),
    localDateTime: expense.localDateTime.toISOString().replace('.000Z', ''),
    description: expense.description,
    category: {
      id: expense.categoryId,
      name: expense.categoryName,
    },
    city: {
      id: expense.cityId,
      name: expense.cityName,
      timezone: expense.cityTimeZone,
    },
    country: {
      id: expense.countryId,
      name: expense.countryName,
    },
    user: {
      id: expense.userId,
      firstName: expense.firstName,
    },
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}
