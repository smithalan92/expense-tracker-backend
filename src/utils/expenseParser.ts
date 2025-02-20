import { type DBExpenseResult } from '../repository/ExpenseRepository__V2';

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
      lastName: expense.lastName,
    },
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
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

export interface ExpenseUser {
  id: number;
  firstName: string;
  lastName: string;
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
  createdAt: Date;
  updatedAt: Date;
  user: ExpenseUser;
}
